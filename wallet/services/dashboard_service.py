from decimal import Decimal
from typing import Any, Dict, List
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncMonth
from wallet.models import Transaction, Account, Budget


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
        budgets progress, and monthly timeline aggregations for a user.
        """
        accounts = Account.objects.filter(user=user)
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')

        user_txs = Transaction.objects.filter(user=user)
        monthly_txs = user_txs.filter(date__year=year, date__month=month)
        yearly_txs = user_txs.filter(date__year=year)

        monthly_income = monthly_txs.filter(type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        monthly_expense = monthly_txs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        monthly_net = monthly_income - monthly_expense

        # All expenses by category in the month
        all_expense_by_cat = (
            monthly_txs.filter(type='expense')
            .values('category_id', 'category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        spent_map = {
            item['category_id']: item['total'] or Decimal('0.00')
            for item in all_expense_by_cat
        }

        expenses_by_category = [
            {'category': item['category__name'], 'total': item['total']}
            for item in all_expense_by_cat[:5]
        ]

        # Budgets progress for the month
        user_budgets = Budget.objects.filter(user=user).select_related('category')
        budgets_progress = []
        for b in user_budgets:
            spent = spent_map.get(b.category_id, Decimal('0.00'))
            limit_val = b.amount or Decimal('0.01')
            pct = float((spent / limit_val) * Decimal('100.0')) if limit_val > 0 else 0.0
            budgets_progress.append({
                'id': b.id,
                'category_id': b.category_id,
                'category_name': b.category.name,
                'limit': float(b.amount),
                'spent': float(spent),
                'percentage': round(pct, 1),
            })
        budgets_progress.sort(key=lambda x: x['percentage'], reverse=True)

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
                'month_number': item['month_trunc'].month if item.get('month_trunc') else None,
                'year': item['month_trunc'].year if item.get('month_trunc') else None,
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
            'budgets_progress': budgets_progress,
            'monthly_summary': monthly_summary,
        }
