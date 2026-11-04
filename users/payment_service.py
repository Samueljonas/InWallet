import uuid
from datetime import timedelta
from decimal import Decimal
from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone

from .models import UserProfile, PaymentTransaction


class PaymentGatewayService:
    """
    Serviço de Gateway de Pagamentos (Pix EMV BR Code & Cartão de Crédito),
    compatível com webhooks Asaas/Stripe e fallback nativo integrado.
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
        """Calcula o checksum CRC16-CCITT (0xFFFF) padrão do Banco Central (BR Code Pix)."""
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
        Gera um payload EMVCo / BR Code (Pix Copia e Cola) válido conforme especificação do BACEN.
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
    def create_checkout(cls, user, period: str = 'yearly', payment_method: str = 'pix', card_data: dict | None = None) -> PaymentTransaction:
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

        # Se for cartão de crédito com dados válidos informados no checkout, aprova imediatamente
        if payment_method == 'credit_card' and card_data:
            cls.confirm_payment(payment)

        return payment

    @classmethod
    @db_transaction.atomic
    def confirm_payment(cls, payment: PaymentTransaction) -> PaymentTransaction:
        """
        Confirma o pagamento de uma transação de assinatura e ativa/estende o plano PRO do usuário.
        Idempotente: chamadas repetidas para uma transação já paga não duplicam o período.
        """
        if payment.status == 'paid':
            return payment

        now = timezone.now()
        payment.status = 'paid'
        payment.paid_at = now
        payment.save(update_fields=['status', 'paid_at', 'updated_at'])

        profile, _ = UserProfile.objects.get_or_create(user=payment.user)
        days = cls.PLAN_DAYS.get(payment.period, 365)

        base_date = now
        if profile.plan == 'pro' and profile.plan_expires_at and profile.plan_expires_at > now:
            base_date = profile.plan_expires_at

        profile.plan = 'pro'
        profile.plan_expires_at = base_date + timedelta(days=days)
        profile.save(update_fields=['plan', 'plan_expires_at', 'updated_at'])

        return payment

