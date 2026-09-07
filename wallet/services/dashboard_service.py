from decimal import Decimal
from typing import Any, Dict, List
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncMonth
from wallet.models import Transaction, Account


class DashboardService:
    """
    Single Responsibility Principle (SRP):
    Dedicated service for financial aggregation, metrics, and chart data formatting.
    Decoupled from HTTP views, serializers, and templates.
    """

    MONTH_NAMES = [
        {'value': 1, 'name': 'Janeiro'},
        {'value': 2, 'name': 'Fevereiro'},
        {'value': 3, 'name': 'Março'},
        {'value': 4, 'name': 'Abril'},
        {'value': 5, 'name': 'Maio'},
        {'value': 6, 'name': 'Junho'},
        {'value': 7, 'name': 'Julho'},
        {'value': 8, 'name': 'Agosto'},
        {'value': 9, 'name': 'Setembro'},
        {'value': 10, 'name': 'Outubro'},
        {'value': 11, 'name': 'Novembro'},
        {'value': 12, 'name': 'Dezembro'},
    ]

    @classmethod
    def get_dashboard_data(cls, user: Any, year: int, month: int) -> Dict[str, Any]:
        """
        Gathers summary metrics, account balances, category distribution,
        and monthly timeline aggregations for a user.
        """
        accounts = Account.objects.filter(user=user)
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')

        user_txs = Transaction.objects.filter(user=user)
        monthly_txs = user_txs.filter(date__year=year, date__month=month)
        yearly_txs = user_txs.filter(date__year=year)

        monthly_income = monthly_txs.filter(type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        monthly_expense = monthly_txs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        monthly_net = monthly_income - monthly_expense

        # Expenses by category (Top 5)
        category_qs = (
            monthly_txs.filter(type='expense')
            .values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')[:5]
        )
        expenses_by_category = [
            {'category': item['category__name'], 'total': item['total']}
            for item in category_qs
        ]

        # Monthly timeline summary for the year
        monthly_summary_qs = (
            yearly_txs.annotate(month_trunc=TruncMonth('date'))
            .values('month_trunc')
            .annotate(
                total_income=Sum(
                    Case(
                        When(type='income', then=F('amount')),
                        default=Decimal('0.00'),
                        output_field=DecimalField()
                    )
                ),
                total_expense=Sum(
                    Case(
                        When(type='expense', then=F('amount')),
                        default=Decimal('0.00'),
                        output_field=DecimalField()
                    )
                )
            )
            .order_by('month_trunc')
        )

        monthly_summary = [
            {
                'month': item['month_trunc'].strftime('%b/%Y') if item.get('month_trunc') else '',
                'income': float(item['total_income']),
                'expense': float(item['total_expense'])
            }
            for item in monthly_summary_qs
        ]

        return {
            'selected_year': year,
            'selected_month': month,
            'accounts': list(accounts),
            'total_balance': total_balance,
            'monthly_income': monthly_income,
            'monthly_expense': monthly_expense,
            'monthly_net': monthly_net,
            'expenses_by_category': expenses_by_category,
            'monthly_summary': monthly_summary,
        }
