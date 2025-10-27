from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal

User = settings.AUTH_USER_MODEL

class Category(models.Model):
    TYPE_CHOICES = (
        ('expense', 'Despesa'),
        ('income', 'Receita')
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)

    class   Meta:
        unique_together = ('user', 'name', 'type')

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0.00'))])

    def __str__(self):
        return f"{self.name} - {self.user.username}"

class Transaction(models.Model):
    TYPE_CHOICES = (
        ('expense', 'Despesa'),
        ('income', 'Receita'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    date = models.DateField(default=timezone.now)
    description = models.CharField(max_length=255, blank=True, null=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.date} - {self.category.name} - R$ {self.amount}"
