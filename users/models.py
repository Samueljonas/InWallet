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
