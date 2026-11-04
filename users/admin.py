from django.contrib import admin
from .models import UserProfile, PaymentTransaction


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'plan_expires_at', 'updated_at')
    list_filter = ('plan',)
    search_fields = ('user__username', 'user__email')


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('external_id', 'user', 'period', 'payment_method', 'amount', 'status', 'paid_at', 'created_at')
    list_filter = ('status', 'payment_method', 'period')
    search_fields = ('external_id', 'user__username', 'user__email')
