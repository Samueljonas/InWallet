from abc import ABC, abstractmethod
from decimal import Decimal
from enum import Enum


class TransactionType(str, Enum):
    INCOME = 'income'
    EXPENSE = 'expense'


class BaseTransactionStrategy(ABC):
    """
    Open/Closed Principle (OCP):
    Base strategy for financial transactions.
    New transaction types (e.g., transfers, investments) can extend this class
    without modifying existing transaction or balance calculation logic.
    """

    @abstractmethod
    def calculate_delta(self, amount: Decimal) -> Decimal:
        """Calculates signed delta to be applied to the account balance."""
        pass


class IncomeStrategy(BaseTransactionStrategy):
    """Adds funds to the account."""

    def calculate_delta(self, amount: Decimal) -> Decimal:
        return Decimal(str(amount))


class ExpenseStrategy(BaseTransactionStrategy):
    """Subtracts funds from the account."""

    def calculate_delta(self, amount: Decimal) -> Decimal:
        return -Decimal(str(amount))


class TransactionStrategyFactory:
    """
    Registry and factory for transaction strategies.
    Open for extension via register_strategy.
    """

    _strategies: dict[str, BaseTransactionStrategy] = {
        TransactionType.INCOME.value: IncomeStrategy(),
        TransactionType.EXPENSE.value: ExpenseStrategy(),
    }

    @classmethod
    def get_strategy(cls, tx_type: str) -> BaseTransactionStrategy:
        strategy = cls._strategies.get(tx_type)
        if not strategy:
            raise ValueError(f"Unsupported transaction type: {tx_type}")
        return strategy

    @classmethod
    def register_strategy(cls, tx_type: str, strategy: BaseTransactionStrategy) -> None:
        """Allows registering new transaction strategies dynamically."""
        cls._strategies[tx_type] = strategy
