from django.contrib import admin
from .models import Category, Account, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'user')
    list_filter = ('type', 'user')
    search_fields = ('name',)

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'balance')
    search_fields = ('name', 'user__username') # Corrigi 'user_username' para 'user__username'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('date', 'user', 'account', 'type', 'amount', 'category')
    list_filter = ('type', 'date', 'category')
    search_fields = ('description',)