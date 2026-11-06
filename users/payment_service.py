import uuid
from datetime import timedelta
from decimal import Decimal
from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone

from .models import UserProfile, PaymentTransaction


class PaymentGatewayService:
    """
    Serviço de Gateway de Pagamentos e Gestão de Assinaturas (InWallet PRO).
    Responsável por:
      1. Geração de payload Pix EMVCo / BR Code (padrão BACEN com CRC16-CCITT).
      2. Criação e confirmação idempotente de transações de checkout.
      3. Troca de ciclo de assinatura (Mensal ⇄ Anual).
      4. Cancelamento agendado ao fim do período vigente ou cancelamento imediato.
    """

    PLAN_PRICES = {
        'monthly': Decimal('14.90'),
        'yearly': Decimal('119.00'),
    }

    PLAN_DAYS = {
        'monthly': 30,
        'yearly': 365,
    }

    @staticmethod
    def _crc16_ccitt(payload: str) -> str:
        """
        Calcula o checksum CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF)
        exigido no campo ID 63 do padrão BR Code (Pix Copia e Cola) do Banco Central.
        """
        crc = 0xFFFF
        polynomial = 0x1021
        for byte in payload.encode('utf-8'):
            crc ^= (byte << 8)
            for _ in range(8):
                if crc & 0x8000:
                    crc = ((crc << 1) ^ polynomial) & 0xFFFF
                else:
                    crc = (crc << 1) & 0xFFFF
        return f"{crc:04X}"

    @classmethod
    def generate_pix_brcode(cls, txid: str, amount: Decimal, merchant_name: str = "INWALLET FINTECH") -> str:
        """
        Monta a árvore TLV (Tag-Length-Value) do EMVCo / BR Code e anexa o CRC16 ao final.
        """
        pix_key = getattr(settings, 'PIX_MERCHANT_KEY', 'pagamentos@inwallet.app')
        city = getattr(settings, 'PIX_MERCHANT_CITY', 'SAO PAULO')
        amount_str = f"{amount:.2f}"
        clean_txid = ''.join(ch for ch in txid if ch.isalnum())[:25] or 'INWALLETPRO'

        def emv_field(field_id: str, value: str) -> str:
            return f"{field_id}{len(value):02d}{value}"

        gui = emv_field("00", "br.gov.bcb.pix")
        key_field = emv_field("01", pix_key)
        merchant_account = emv_field("26", gui + key_field)

        additional_data = emv_field("62", emv_field("05", clean_txid))

        body = (
            emv_field("00", "01")
            + merchant_account
            + emv_field("52", "0000")
            + emv_field("53", "986")
            + emv_field("54", amount_str)
            + emv_field("58", "BR")
            + emv_field("59", merchant_name[:25])
            + emv_field("60", city[:15])
            + additional_data
            + "6304"
        )
        crc = cls._crc16_ccitt(body)
        return body + crc

    @classmethod
    @db_transaction.atomic
    def create_checkout(
        cls,
        user,
        period: str = 'yearly',
        payment_method: str = 'pix',
        card_data: dict | None = None,
    ) -> PaymentTransaction:
        if period not in cls.PLAN_PRICES:
            period = 'yearly'
        if payment_method not in ('pix', 'credit_card'):
            payment_method = 'pix'

        amount = cls.PLAN_PRICES[period]
        external_id = f"inw_{uuid.uuid4().hex[:20]}"
        pix_payload = None

        if payment_method == 'pix':
            pix_payload = cls.generate_pix_brcode(external_id, amount)

        payment = PaymentTransaction.objects.create(
            user=user,
            external_id=external_id,
            provider=getattr(settings, 'PAYMENT_PROVIDER', 'inwallet_pay'),
            payment_method=payment_method,
            period=period,
            amount=amount,
            status='pending',
            pix_payload=pix_payload,
        )

        # Em checkout via cartão, liquida a transação na mesma transação atômica
        if payment_method == 'credit_card' and card_data:
            cls.confirm_payment(payment)

        return payment

    @classmethod
    @db_transaction.atomic
    def confirm_payment(cls, payment: PaymentTransaction) -> PaymentTransaction:
        """
        Confirma o pagamento de uma transação de assinatura e ativa/estende o plano PRO do usuário.
        Usa select_for_update para garantir idempotência sob webhooks concorrentes.
        """
        locked_payment = PaymentTransaction.objects.select_for_update().get(pk=payment.pk)
        if locked_payment.status == 'paid':
            return locked_payment

        now = timezone.now()
        locked_payment.status = 'paid'
        locked_payment.paid_at = now
        locked_payment.save(update_fields=['status', 'paid_at', 'updated_at'])

        profile, _ = UserProfile.objects.select_for_update().get_or_create(user=locked_payment.user)
        days = cls.PLAN_DAYS.get(locked_payment.period, 365)

        # Se o usuário já está ativo no PRO, soma os novos dias ao final da vigência atual
        base_date = now
        if profile.plan == 'pro' and profile.plan_expires_at and profile.plan_expires_at > now:
            base_date = profile.plan_expires_at

        profile.plan = 'pro'
        profile.billing_cycle = locked_payment.period
        profile.plan_expires_at = base_date + timedelta(days=days)
        profile.cancel_at_period_end = False
        profile.save(update_fields=['plan', 'billing_cycle', 'plan_expires_at', 'cancel_at_period_end', 'updated_at'])

        return locked_payment

    @classmethod
    @db_transaction.atomic
    def change_plan(cls, user, new_period: str) -> UserProfile:
        """
        Altera o ciclo de cobrança da assinatura ativa (Mensal ⇄ Anual)
        e reativa a renovação automática caso estivesse com cancelamento agendado.
        """
        if new_period not in ('monthly', 'yearly'):
            raise ValueError("Ciclo inválido. Escolha 'monthly' ou 'yearly'.")

        profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
        profile.billing_cycle = new_period
        profile.cancel_at_period_end = False
        profile.save(update_fields=['billing_cycle', 'cancel_at_period_end', 'updated_at'])
        return profile

    @classmethod
    @db_transaction.atomic
    def cancel_subscription(cls, user, immediate: bool = False) -> UserProfile:
        """
        Cancela a assinatura PRO do usuário:
        - `immediate=False` (padrão): agenda o cancelamento para o fim do ciclo já pago (`cancel_at_period_end=True`),
          preservando o acesso PRO até `plan_expires_at`.
        - `immediate=True`: encerra o plano PRO imediatamente e retorna para 'free'.
        """
        profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
        if immediate or not profile.plan_expires_at or profile.plan_expires_at <= timezone.now():
            profile.plan = 'free'
            profile.plan_expires_at = None
            profile.cancel_at_period_end = False
        else:
            profile.cancel_at_period_end = True

        profile.save(update_fields=['plan', 'plan_expires_at', 'cancel_at_period_end', 'updated_at'])
        return profile
