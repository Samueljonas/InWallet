from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class UserProfile(models.Model):
    """
    Perfil estendido do usuário que armazena o estado da assinatura (Free vs Pro),
    o ciclo de cobrança escolhido (mensal ou anual), a data de expiração do período
    vigente e a flag de cancelamento agendado ao fim do ciclo.
    """
    PLAN_CHOICES = (
        ('free', 'Gratuito'),
        ('pro', 'Pro'),
    )
    CYCLE_CHOICES = (
        ('monthly', 'Mensal'),
        ('yearly', 'Anual'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    billing_cycle = models.CharField(max_length=20, choices=CYCLE_CHOICES, default='yearly')
    plan_expires_at = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_plan_display()} ({self.billing_cycle})"

    @property
    def is_pro(self) -> bool:
        """
        Retorna True se o plano for 'pro' e a data de expiração ainda não tiver passado.
        Mesmo que o usuário agende o cancelamento (`cancel_at_period_end=True`),
        ele mantém o acesso Pro até o término do período já pago (`plan_expires_at`).
        """
        if self.plan == 'pro':
            if self.plan_expires_at is None:
                return True
            return self.plan_expires_at > timezone.now()
        return False


def is_user_pro(user) -> bool:
    """
    Helper centralizado (DRY) para verificar se um usuário autenticado possui
    assinatura Pro ativa, criando o UserProfile sob demanda caso ainda não exista.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    profile = getattr(user, 'profile', None)
    if profile is None:
        profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.is_pro


class PaymentTransaction(models.Model):
    """
    Registro auditável de transações de pagamento de assinatura (Pix EMV e Cartão).
    Garante idempotência na confirmação via webhook para evitar duplicidade de créditos.
    """
    STATUS_CHOICES = (
        ('pending', 'Pendente'),
        ('paid', 'Pago'),
        ('failed', 'Falhou'),
        ('refunded', 'Estornado'),
    )
    METHOD_CHOICES = (
        ('pix', 'Pix'),
        ('credit_card', 'Cartão de Crédito'),
    )
    PERIOD_CHOICES = (
        ('monthly', 'Mensal'),
        ('yearly', 'Anual'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    external_id = models.CharField(max_length=100, unique=True, db_index=True)
    provider = models.CharField(max_length=30, default='inwallet_pay')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='pix')
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='yearly')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pix_payload = models.TextField(blank=True, null=True)
    checkout_url = models.URLField(blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.period} ({self.status}) - R$ {self.amount}"
