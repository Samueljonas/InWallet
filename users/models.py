from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class UserProfile(models.Model):
    PLAN_CHOICES = (
        ('free', 'Gratuito'),
        ('pro', 'Pro'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    plan_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_plan_display()}"

    @property
    def is_pro(self) -> bool:
        if self.plan == 'pro':
            if self.plan_expires_at is None:
                return True
            return self.plan_expires_at > timezone.now()
        return False


class PaymentTransaction(models.Model):
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

