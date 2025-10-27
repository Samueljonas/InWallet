from django.db import models
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import Transaction, Account
from decimal import Decimal
from django.apps import apps

# --- SINAIS PARA ATUALIZAR O SALDO DA CONTA ---

def _get_delta_for(amount, tx_type):
    """ Helper para calcular o delta (positivo ou negativo) """
    if tx_type == 'income':
        return Decimal(amount)
    elif tx_type == 'expense':
        return -Decimal(amount)
    return Decimal('0.00')

@receiver(pre_save, sender=Transaction)
def tx_pre_save(sender, instance, **kwargs):
    """
    Antes de salvar, armazena os valores antigos (se for uma atualização)
    para que possamos reverter o saldo antigo corretamente.
    """
    if instance.pk:
        try:
            old_tx = Transaction.objects.get(pk=instance.pk)
            instance._old_amount = old_tx.amount
            instance._old_account_id = old_tx.account_id
            instance._old_type = old_tx.type
        except Transaction.DoesNotExist:
            # Objeto está sendo criado, mas tem um PK? (raro)
            instance._old_amount = None
            instance._old_account_id = None
            instance._old_type = None
    else:
        # Objeto está sendo criado
        instance._old_amount = None
        instance._old_account_id = None
        instance._old_type = None

@receiver(post_save, sender=Transaction)
def tx_post_save(sender, instance, created, **kwargs):
    """
    Após salvar, atualiza os saldos das contas (novas ou antigas).
    """
    
    new_delta = _get_delta_for(instance.amount, instance.type)
    
    if created:
        # Transação nova, apenas aplica o delta na conta
        acc = instance.account
        acc.balance = (acc.balance or Decimal('0.00')) + new_delta
        acc.save(update_fields=['balance'])
    
    else:
        # Transação existente (atualização)
        old_delta = _get_delta_for(instance._old_amount or '0.00', instance._old_type or instance.type)
        
        if instance._old_account_id == instance.account_id:
            # 1. Conta é a mesma, apenas ajusta a diferença
            acc = instance.account
            acc.balance = (acc.balance or Decimal('0.00')) - old_delta + new_delta
            acc.save(update_fields=['balance'])
        
        else:
            # 2. Conta mudou! Reverte na conta antiga, aplica na nova.
            # Reverte na conta antiga
            if instance._old_account_id:
                try:
                    old_acc = Account.objects.get(pk=instance._old_account_id)
                    old_acc.balance = (old_acc.balance or Decimal('0.00')) - old_delta
                    old_acc.save(update_fields=['balance'])
                except Account.DoesNotExist:
                    pass # Conta antiga foi deletada?
            
            # Aplica na conta nova
            acc = instance.account
            acc.balance = (acc.balance or Decimal('0.00')) + new_delta
            acc.save(update_fields=['balance'])

@receiver(post_delete, sender=Transaction)
def tx_post_delete(sender, instance, **kwargs):
    """
    Após deletar uma transação, reverte o valor na conta.
    """
    delta_to_reverse = _get_delta_for(instance.amount, instance.type)
    
    try:
        acc = instance.account
        acc.balance = (acc.balance or Decimal('0.00')) - delta_to_reverse
        acc.save(update_fields=['balance'])
    except Account.DoesNotExist:
        # A conta pode não existir mais, tudo bem.
        pass