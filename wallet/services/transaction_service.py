from decimal import Decimal
from typing import Optional, Any
from django.db import transaction as db_transaction
from django.core.exceptions import ValidationError
from wallet.models import Transaction, Account, Category
from .strategies import TransactionStrategyFactory


class TransactionService:
    """
    Single Responsibility (SRP) & Dependency Inversion (DIP):
    Handles all business logic and atomic ledger updates for Transactions.
    Removes side-effect-heavy balance calculations from signals and views.
    """

    @classmethod
    @db_transaction.atomic
    def create_transaction(
        cls,
        user: Any,
        account: Account,
        category: Category,
        tx_type: str,
        amount: Decimal,
        date: Any,
        description: Optional[str] = "",
        payment_method: Optional[str] = "",
        note: Optional[str] = ""
    ) -> Transaction:
        """
        Creates a transaction and atomically updates the associated account balance.
        """
        # Ensure the account and category belong to the user
        if account.user != user:
            raise ValidationError("Account does not belong to the user.")
        if category.user != user:
            raise ValidationError("Category does not belong to the user.")

        strategy = TransactionStrategyFactory.get_strategy(tx_type)
        delta = strategy.calculate_delta(amount)

        # Atomic lock on account row to prevent race conditions
        locked_account = Account.objects.select_for_update().get(pk=account.pk)

        transaction = Transaction.objects.create(
            user=user,
            account=locked_account,
            category=category,
            type=tx_type,
            amount=amount,
            date=date,
            description=description,
            payment_method=payment_method,
            note=note
        )

        locked_account.balance = (locked_account.balance or Decimal('0.00')) + delta
        locked_account.save(update_fields=['balance'])

        return transaction

    @classmethod
    @db_transaction.atomic
    def update_transaction(
        cls,
        transaction: Transaction,
        **updated_fields
    ) -> Transaction:
        """
        Updates a transaction and adjusts account balance(s) with exact differentials.
        """
        old_account = Account.objects.select_for_update().get(pk=transaction.account_id)
        old_strategy = TransactionStrategyFactory.get_strategy(transaction.type)
        old_delta = old_strategy.calculate_delta(transaction.amount)

        new_account = updated_fields.get('account', transaction.account)
        new_amount = updated_fields.get('amount', transaction.amount)
        new_type = updated_fields.get('type', transaction.type)

        new_strategy = TransactionStrategyFactory.get_strategy(new_type)
        new_delta = new_strategy.calculate_delta(new_amount)

        if old_account.pk == new_account.pk:
            # Same account: adjust differential
            old_account.balance = (old_account.balance or Decimal('0.00')) - old_delta + new_delta
            old_account.save(update_fields=['balance'])
        else:
            # Different account: revert old, apply to new
            old_account.balance = (old_account.balance or Decimal('0.00')) - old_delta
            old_account.save(update_fields=['balance'])

            locked_new_account = Account.objects.select_for_update().get(pk=new_account.pk)
            locked_new_account.balance = (locked_new_account.balance or Decimal('0.00')) + new_delta
            locked_new_account.save(update_fields=['balance'])

        for field, value in updated_fields.items():
            setattr(transaction, field, value)
        transaction.save()

        return transaction

    @classmethod
    @db_transaction.atomic
    def delete_transaction(cls, transaction: Transaction) -> None:
        """
        Deletes a transaction and reverts its impact on the account balance.
        """
        strategy = TransactionStrategyFactory.get_strategy(transaction.type)
        delta = strategy.calculate_delta(transaction.amount)

        account = Account.objects.select_for_update().get(pk=transaction.account_id)
        account.balance = (account.balance or Decimal('0.00')) - delta
        account.save(update_fields=['balance'])

        transaction.delete()
