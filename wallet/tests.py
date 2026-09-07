from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Account, Category, Transaction
from .services import (
    TransactionType,
    BaseTransactionStrategy,
    IncomeStrategy,
    ExpenseStrategy,
    TransactionStrategyFactory,
    TransactionService,
    DashboardService,
)

User = get_user_model()


class SOLIDPrinciplesUnitTest(TestCase):
    """
    Tests validating adherence to SOLID principles:
    - OCP: TransactionStrategyFactory & Polymorphic Delta calculation
    - SRP: TransactionService & DashboardService isolated operations
    - DIP: Domain logic decoupled from views/signals
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='Password123!'
        )
        self.account = Account.objects.create(
            user=self.user,
            name='Carteira Principal',
            balance=Decimal('1000.00')
        )
        self.income_cat = Category.objects.create(
            user=self.user,
            name='Salário',
            type='income'
        )
        self.expense_cat = Category.objects.create(
            user=self.user,
            name='Alimentação',
            type='expense'
        )

    # --- Open/Closed Principle (OCP) Tests ---

    def test_ocp_strategy_factory_delta_calculation(self):
        income_strategy = TransactionStrategyFactory.get_strategy('income')
        self.assertEqual(income_strategy.calculate_delta(Decimal('150.00')), Decimal('150.00'))

        expense_strategy = TransactionStrategyFactory.get_strategy('expense')
        self.assertEqual(expense_strategy.calculate_delta(Decimal('50.00')), Decimal('-50.00'))

    def test_ocp_strategy_extensibility(self):
        # Demonstrates Open for Extension: adding a new strategy without modifying existing code
        class CashbackStrategy(BaseTransactionStrategy):
            def calculate_delta(self, amount: Decimal) -> Decimal:
                return Decimal(str(amount)) * Decimal('0.05')

        TransactionStrategyFactory.register_strategy('cashback', CashbackStrategy())
        cashback_strategy = TransactionStrategyFactory.get_strategy('cashback')
        self.assertEqual(cashback_strategy.calculate_delta(Decimal('100.00')), Decimal('5.00'))

    # --- Single Responsibility & Atomic Service Tests ---

    def test_srp_transaction_service_create_expense(self):
        tx = TransactionService.create_transaction(
            user=self.user,
            account=self.account,
            category=self.expense_cat,
            tx_type='expense',
            amount=Decimal('200.00'),
            date=timezone.now().date(),
            description='Supermercado'
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('800.00'))
        self.assertEqual(tx.amount, Decimal('200.00'))

    def test_srp_transaction_service_create_income(self):
        tx = TransactionService.create_transaction(
            user=self.user,
            account=self.account,
            category=self.income_cat,
            tx_type='income',
            amount=Decimal('500.00'),
            date=timezone.now().date(),
            description='Bônus'
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('1500.00'))

    def test_srp_transaction_service_update_amount(self):
        tx = TransactionService.create_transaction(
            user=self.user,
            account=self.account,
            category=self.expense_cat,
            tx_type='expense',
            amount=Decimal('100.00'),
            date=timezone.now().date()
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('900.00'))

        # Update expense from 100 to 150
        TransactionService.update_transaction(
            transaction=tx,
            amount=Decimal('150.00'),
            description='Valor corrigido'
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('850.00'))

    def test_srp_transaction_service_delete(self):
        tx = TransactionService.create_transaction(
            user=self.user,
            account=self.account,
            category=self.expense_cat,
            tx_type='expense',
            amount=Decimal('300.00'),
            date=timezone.now().date()
        )
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('700.00'))

        TransactionService.delete_transaction(tx)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('1000.00'))

    def test_dashboard_service_aggregations(self):
        today = timezone.now().date()
        TransactionService.create_transaction(
            user=self.user,
            account=self.account,
            category=self.income_cat,
            tx_type='income',
            amount=Decimal('1000.00'),
            date=today
        )
        TransactionService.create_transaction(
            user=self.user,
            account=self.account,
            category=self.expense_cat,
            tx_type='expense',
            amount=Decimal('250.00'),
            date=today
        )

        data = DashboardService.get_dashboard_data(self.user, today.year, today.month)
        self.assertEqual(data['monthly_income'], Decimal('1000.00'))
        self.assertEqual(data['monthly_expense'], Decimal('250.00'))
        self.assertEqual(data['monthly_net'], Decimal('750.00'))
        self.assertEqual(len(data['expenses_by_category']), 1)


class WalletAPITests(APITestCase):
    """
    Tests for DRF API endpoints with JWT authentication.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='Password123!'
        )
        self.client.force_authenticate(user=self.user)
        self.account = Account.objects.create(
            user=self.user,
            name='Nubank',
            balance=Decimal('500.00')
        )
        self.category = Category.objects.create(
            user=self.user,
            name='Transporte',
            type='expense'
        )

    def test_api_create_transaction_updates_balance(self):
        url = '/api/v1/transactions/'
        payload = {
            'account': self.account.id,
            'category': self.category.id,
            'type': 'expense',
            'amount': '50.00',
            'date': timezone.now().date().isoformat(),
            'description': 'Uber',
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('450.00'))

    def test_api_dashboard_endpoint(self):
        url = '/api/v1/dashboard/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_balance', response.data)
        self.assertIn('monthly_net', response.data)
