import json
from decimal import Decimal
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import redirect
from django.views.generic import TemplateView, ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.utils import timezone

from .models import Transaction, Account, Category
from .forms import ExpenseForm, IncomeForm, AccountForm, CategoryForm
from .services import DashboardService, TransactionService


class DashboardView(LoginRequiredMixin, TemplateView):
    """
    Template view for the web dashboard.
    Delegates all business metrics calculation to DashboardService (SRP/DIP).
    """
    template_name = 'dashboard.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        current_year = timezone.now().year
        current_month = timezone.now().month

        try:
            year_filter = int(self.request.GET.get('year', current_year))
        except (ValueError, TypeError):
            year_filter = current_year

        try:
            month_filter = int(self.request.GET.get('month', current_month))
        except (ValueError, TypeError):
            month_filter = current_month

        dashboard_data = DashboardService.get_dashboard_data(
            user=user,
            year=year_filter,
            month=month_filter
        )

        ctx.update(dashboard_data)
        ctx['year_options'] = range(current_year, current_year - 5, -1)
        ctx['month_options'] = DashboardService.MONTH_NAMES

        # Formats for legacy Chart.js in Django templates
        ctx['category_labels'] = json.dumps([item['category'] for item in dashboard_data['expenses_by_category']])
        ctx['category_data'] = json.dumps([float(item['total']) for item in dashboard_data['expenses_by_category']])
        ctx['month_labels'] = json.dumps([item['month'] for item in dashboard_data['monthly_summary']])
        ctx['income_data'] = json.dumps([item['income'] for item in dashboard_data['monthly_summary']])
        ctx['expense_data'] = json.dumps([item['expense'] for item in dashboard_data['monthly_summary']])

        return ctx


class UserFilteredQuerysetMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Mixin to secure user-owned resources.
    """
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def test_func(self):
        if hasattr(self, 'get_object'):
            obj = self.get_object()
            return obj.user == self.request.user
        return True


class BaseTransactionCreateView(LoginRequiredMixin, CreateView):
    model = Transaction
    template_name = 'transaction/form.html'
    success_url = reverse_lazy('wallet:dashboard')
    transaction_type = 'expense'

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        cleaned = form.cleaned_data
        TransactionService.create_transaction(
            user=self.request.user,
            account=cleaned['account'],
            category=cleaned['category'],
            tx_type=self.transaction_type,
            amount=cleaned['amount'],
            date=cleaned['date'],
            description=cleaned.get('description', ''),
            payment_method=cleaned.get('payment_method', ''),
            note=cleaned.get('note', '')
        )
        return redirect(self.get_success_url())


class ExpenseCreateView(BaseTransactionCreateView):
    form_class = ExpenseForm
    transaction_type = 'expense'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💸 Registrar Novo Gasto'
        return context


class IncomeCreateView(BaseTransactionCreateView):
    form_class = IncomeForm
    transaction_type = 'income'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💰 Adicionar Nova Receita'
        return context


class TransactionListView(UserFilteredQuerysetMixin, ListView):
    model = Transaction
    template_name = 'transaction/list.html'
    context_object_name = 'transaction'
    paginate_by = 15

    def get_queryset(self):
        return super().get_queryset().order_by('-date', '-id')


class TransactionUpdateView(UserFilteredQuerysetMixin, UpdateView):
    model = Transaction
    template_name = 'transaction/form.html'
    success_url = reverse_lazy('wallet:transaction_list')

    def get_form_class(self):
        transaction = self.get_object()
        return IncomeForm if transaction.type == 'income' else ExpenseForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💰 Editar Receita' if self.get_object().type == 'income' else '💸 Editar Gasto'
        return context

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        transaction = self.get_object()
        cleaned = form.cleaned_data
        TransactionService.update_transaction(
            transaction=transaction,
            account=cleaned['account'],
            category=cleaned['category'],
            type=transaction.type,
            amount=cleaned['amount'],
            date=cleaned['date'],
            description=cleaned.get('description', ''),
            payment_method=cleaned.get('payment_method', ''),
            note=cleaned.get('note', '')
        )
        return redirect(self.get_success_url())


class TransactionDeleteView(UserFilteredQuerysetMixin, DeleteView):
    model = Transaction
    template_name = 'transaction/confirm_delete.html'
    success_url = reverse_lazy('wallet:transaction_list')

    def form_valid(self, form):
        transaction = self.get_object()
        TransactionService.delete_transaction(transaction)
        return redirect(self.get_success_url())


# --- CRUD de Configurações (Contas e Categorias) ---

class BaseSettingsCreateView(LoginRequiredMixin, CreateView):
    template_name = 'settings/generic_form.html'

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)


class BaseSettingsUpdateView(UserFilteredQuerysetMixin, UpdateView):
    template_name = 'settings/generic_form.html'


class BaseSettingsDeleteView(UserFilteredQuerysetMixin, DeleteView):
    template_name = 'settings/generic_confirm_delete.html'


class AccountListView(UserFilteredQuerysetMixin, ListView):
    model = Account
    template_name = 'settings/account_list.html'
    context_object_name = 'accounts'


class AccountCreateView(BaseSettingsCreateView):
    model = Account
    form_class = AccountForm
    success_url = reverse_lazy('wallet:account_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Criar Nova Conta'
        context['cancel_url'] = reverse_lazy('wallet:account_list')
        return context


class AccountUpdateView(BaseSettingsUpdateView):
    model = Account
    form_class = AccountForm
    success_url = reverse_lazy('wallet:account_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = f"Editar Conta: {self.object.name}"
        context['cancel_url'] = reverse_lazy('wallet:account_list')
        return context


class AccountDeleteView(BaseSettingsDeleteView):
    model = Account
    success_url = reverse_lazy('wallet:account_list')


class CategoryListView(UserFilteredQuerysetMixin, ListView):
    model = Category
    template_name = 'settings/category_list.html'
    context_object_name = 'categories'


class CategoryCreateView(BaseSettingsCreateView):
    model = Category
    form_class = CategoryForm
    success_url = reverse_lazy('wallet:category_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Criar Nova Categoria'
        context['cancel_url'] = reverse_lazy('wallet:category_list')
        return context


class CategoryUpdateView(BaseSettingsUpdateView):
    model = Category
    form_class = CategoryForm
    success_url = reverse_lazy('wallet:category_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = f"Editar Categoria: {self.object.name}"
        context['cancel_url'] = reverse_lazy('wallet:category_list')
        return context


class CategoryDeleteView(BaseSettingsDeleteView):
    model = Category
    success_url = reverse_lazy('wallet:category_list')