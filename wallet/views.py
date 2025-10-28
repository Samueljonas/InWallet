from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView, ListView, CreateView
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncMonth
from django.urls import reverse_lazy
from .models import Transaction, Account
from .forms import ExpenseForm, IncomeForm # Importa os novos forms
from django.utils import timezone
from decimal import Decimal
from django.views.generic import ListView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'dashboard.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        today = timezone.now() # Corrigido de Timezone.now()

        # 1. Filtro base de transações
        qs = Transaction.objects.filter(user=user)

        # 2. Saldos por conta (como já existia)
        accounts = Account.objects.filter(user=user)
        ctx['accounts'] = accounts

        # 3. (NOVO) Totais para os Cards Principais
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
        
        monthly_income = qs.filter(
            type='income', 
            date__year=today.year, 
            date__month=today.month
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        monthly_expense = qs.filter(
            type='expense', 
            date__year=today.year, 
            date__month=today.month
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        ctx['total_balance'] = total_balance
        ctx['monthly_income'] = monthly_income
        ctx['monthly_expense'] = monthly_expense
        ctx['monthly_net'] = monthly_income - monthly_expense

        # 4. Top 5 gastos (como já existia)
        ctx['expenses_by_category'] = (
            qs.filter(type='expense')
            .values('category__name') # Corrigido de category_name para category__name
            .annotate(total=Sum('amount'))
            .order_by('-total')[:5]
        )

        # 5. Resumo Mensal (como já existia)
        ctx['monthly_summary'] = (
            qs.annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(
                total_income=Sum(Case(When(type='income', then=F('amount')), default=Decimal('0.0'), output_field=DecimalField())),
                total_expense=Sum(Case(When(type='expense', then=F('amount')), default=Decimal('0.0'), output_field=DecimalField()))
            )
            .annotate(
                net=F('total_income') - F('total_expense')
            )
            .order_by('-month')[:12]
        )
        return ctx


class BaseTransactionCreateView(LoginRequiredMixin, CreateView):
    """
    View base para criar transações.
    Passa o 'user' para o formulário e define o 'user' na transação.
    """
    model = Transaction
    template_name = 'transaction/form.html'
    success_url = reverse_lazy('wallet:dashboard')

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)

    def get_form_kwargs(self):
        """
        Passa o 'request.user' para o __init__ do formulário.
        """
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

class ExpenseCreateView(BaseTransactionCreateView):
    """
    View para criar GASTOS.
    """
    form_class = ExpenseForm
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💸 Registrar Novo Gasto'
        return context

class IncomeCreateView(BaseTransactionCreateView):
    """
    View para criar RECEITAS.
    """
    form_class = IncomeForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = '💰 Adicionar Nova Receita'
        return context


class TransactionListView(LoginRequiredMixin, ListView):
    model = Transaction
    template_name = 'transaction/list.html'
    paginate_by = 20

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
class UserFilteredQuerysetMixin(LoginRequiredMixin, UserPassesTestMixin):
    """
    Mixin para garantir que o usuário só possa ver/editar/deletar
    seus próprios objetos.
    """
    def get_queryset(self):
        # Filtra o queryset base para incluir apenas itens do usuário logado
        return super().get_queryset().filter(user=self.request.user)

    def test_func(self):
        # Garante que o usuário logado é o dono do objeto
        # Usado por UpdateView e DeleteView
        if hasattr(self, 'get_object'):
            obj = self.get_object()
            return obj.user == self.request.user
        return True # Para ListView

class TransactionListView(UserFilteredQuerysetMixin, ListView):
    """
    View para LER (Listar) todas as transações (o R do CRUD).
    """
    model = Transaction
    template_name = 'transaction/list.html'
    context_object_name = 'transaction'
    paginate_by = 15 # Mostra 15 transações por página

    def get_queryset(self):
        return super().get_queryset().order_by('-date', '-id')
class TransactionUpdateView(UserFilteredQuerysetMixin, UpdateView):
    """
    View para ATUALIZAR uma transação (o U do CRUD).
    """
    model = Transaction
    template_name = 'transaction/form.html'
    success_url = reverse_lazy('wallet:transaction_list') # Volta para a lista após editar

    def get_form_class(self):
        """
        Seleciona dinamicamente o formulário (Income ou Expense)
        baseado no tipo da transação que está sendo editada.
        """
        transaction = self.get_object()
        if transaction.type == 'income':
            return IncomeForm
        else:
            return ExpenseForm

    def get_context_data(self, **kwargs):
        """
        Define o título da página para 'Editar Transação'.
        """
        context = super().get_context_data(**kwargs)
        if self.get_object().type == 'income':
            context['form_title'] = '💰 Editar Receita'
        else:
            context['form_title'] = '💸 Editar Gasto'
        return context

    def get_form_kwargs(self):
        """
        Passa o 'request.user' para o __init__ do formulário
        (para que ele possa filtrar as categorias e contas).
        """
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

class TransactionDeleteView(UserFilteredQuerysetMixin, DeleteView):
    """
    View para DELETAR uma transação (o D do CRUD).
    """
    model = Transaction
    template_name = 'transaction/confirm_delete.html'
    success_url = reverse_lazy('wallet:transaction_list') # Volta para a lista após deletar