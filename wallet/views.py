from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import TemplateView, ListView, CreateView, UpdateView, DeleteView
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncMonth
from django.urls import reverse_lazy
from .models import Transaction, Account, Category
from .forms import ExpenseForm, IncomeForm
from django.utils import timezone
from decimal import Decimal
import json
from .forms import AccountForm, CategoryForm
import datetime

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'dashboard.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        
        # --- INÍCIO DA LÓGICA DE FILTRO ---
        
        # Pega o ano e mês atuais como padrão
        current_year = timezone.now().year
        current_month = timezone.now().month
        
        # Tenta pegar o ano e mês da URL (do formulário GET)
        # Usamos 'int' para garantir que são números
        try:
            # O 'year' vindo do GET é uma string, convertemos para int
            year_filter = int(self.request.GET.get('year', current_year))
        except ValueError:
            year_filter = current_year
            
        try:
            # O 'month' vindo do GET é uma string, convertemos para int
            month_filter = int(self.request.GET.get('month', current_month))
        except ValueError:
            month_filter = current_month

        # Adiciona os filtros ao contexto para o formulário
        ctx['selected_year'] = year_filter
        ctx['selected_month'] = month_filter
        
        # Gera uma lista de anos para o dropdown (ex: 2025, 2024, 2023)
        ctx['year_options'] = range(current_year, current_year - 5, -1)
        # Gera uma lista de meses para o dropdown
        ctx['month_options'] = [
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
        
        # --- FIM DA LÓGICA DE FILTRO ---

        # 1. Filtro base de transações (AGORA USA O FILTRO)
        qs = Transaction.objects.filter(user=user)
        
        # Filtra transações pelo mês e ano selecionados
        monthly_qs = qs.filter(date__year=year_filter, date__month=month_filter)
        
        # Filtra transações pelo ano selecionado (para o gráfico anual)
        yearly_qs = qs.filter(date__year=year_filter)

        # 2. Saldos por conta (Não muda com o filtro de data)
        accounts = Account.objects.filter(user=user)
        ctx['accounts'] = accounts

        # 3. Totais para os Cards Principais (AGORA USAM O FILTRO)
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
        
        monthly_income = monthly_qs.filter(
            type='income'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        monthly_expense = monthly_qs.filter(
            type='expense'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        ctx['total_balance'] = total_balance
        ctx['monthly_income'] = monthly_income
        ctx['monthly_expense'] = monthly_expense
        ctx['monthly_net'] = monthly_income - monthly_expense

        # 4. Dados para o Gráfico de Categorias (AGORA USA O FILTRO)
        category_qs = (
            monthly_qs.filter(type='expense') # Filtra pelo mês selecionado
            .values('category__name') 
            .annotate(total=Sum('amount'))
            .order_by('-total')[:5]
        )
        category_labels = [item['category__name'] for item in category_qs]
        category_data = [float(item['total']) for item in category_qs]
        
        ctx['category_labels'] = json.dumps(category_labels)
        ctx['category_data'] = json.dumps(category_data)
        ctx['expenses_by_category'] = category_qs

        # 5. Dados para o Gráfico Mensal (AGORA FILTRA PELO ANO)
        monthly_summary_qs = (
            yearly_qs.annotate(month=TruncMonth('date')) # Filtra pelo ano selecionado
            .values('month')
            .annotate(
                total_income=Sum(Case(When(type='income', then=F('amount')), default=Decimal('0.0'), output_field=DecimalField())),
                total_expense=Sum(Case(When(type='expense', then=F('amount')), default=Decimal('0.0'), output_field=DecimalField()))
            )
            .order_by('month')
        )
        
        month_labels = [item['month'].strftime('%b/%Y') for item in monthly_summary_qs]
        income_data = [float(item['total_income']) for item in monthly_summary_qs]
        expense_data = [float(item['total_expense']) for item in monthly_summary_qs]
        
        ctx['month_labels'] = json.dumps(month_labels)
        ctx['income_data'] = json.dumps(income_data)
        ctx['expense_data'] = json.dumps(expense_data)
        ctx['monthly_summary'] = monthly_summary_qs

        return ctx

# ----------------------------------------------------
# VIEWS DE TRANSAÇÃO (CRUD)
# (Este código não muda)
# ----------------------------------------------------

class BaseTransactionCreateView(LoginRequiredMixin, CreateView):
    model = Transaction
    template_name = 'transaction/form.html'
    success_url = reverse_lazy('wallet:dashboard')

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

class ExpenseCreateView(BaseTransactionCreateView):
    form_class = ExpenseForm
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💸 Registrar Novo Gasto'
        return context

class IncomeCreateView(BaseTransactionCreateView):
    form_class = IncomeForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💰 Adicionar Nova Receita'
        return context


class UserFilteredQuerysetMixin(LoginRequiredMixin, UserPassesTestMixin):
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def test_func(self):
        if hasattr(self, 'get_object'):
            obj = self.get_object()
            return obj.user == self.request.user
        return True 

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
        if transaction.type == 'income':
            return IncomeForm
        else:
            return ExpenseForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.get_object().type == 'income':
            context['form_title'] = '💰 Editar Receita'
        else:
            context['form_title'] = '💸 Editar Gasto'
        return context

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

class TransactionDeleteView(UserFilteredQuerysetMixin, DeleteView):
    model = Transaction
    template_name = 'transaction/confirm_delete.html'
    success_url = reverse_lazy('wallet:transaction_list')
class BaseSettingsCreateView(LoginRequiredMixin, CreateView):
    """
    View base para CRIAR Contas ou Categorias.
    Define o 'user' automaticamente.
    """
    template_name = 'settings/generic_form.html'
    
    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)

class BaseSettingsUpdateView(UserFilteredQuerysetMixin, UpdateView):
    """
    View base para ATUALIZAR Contas ou Categorias.
    Usa o UserFilteredQuerysetMixin para segurança.
    """
    template_name = 'settings/generic_form.html'

class BaseSettingsDeleteView(UserFilteredQuerysetMixin, DeleteView):
    """
    View base para DELETAR Contas ou Categorias.
    """
    template_name = 'settings/generic_confirm_delete.html'

# --- CRUD de Contas ---

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

# --- CRUD de Categorias ---

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