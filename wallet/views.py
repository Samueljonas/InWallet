from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView, ListView, CreateView
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncMonth
from django.urls import reverse_lazy
from .models import Transaction, Account
from .forms import TransactionForm

class DashboardView(loginRequiredMixin, TemplateView):
    template_name = 'dashboard.html'


    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        ctx['accounts'] = Account.objects.filter(user=user)

        qs = Transaction.objects.filter(user=user)
        ctx['monthly'] = (
            qs.annotate(month=TruncMonth('date'))
              .values('month')
              .annotate(total=Sum(
                  Case(
                      When(type='income', then=F('amount')),
                      When(type='expense', then=-F('amount')),
                      output_field=DecimalField()
                  )
              ))
              .order_by('-month')[:12]
        )
        ctx['expenses_by_category'] = (
            qs.filter(type='expense')
              .values('category__name')
              .annotate(total=Sum('amount'))
              .order_by('-total')[:5]
        )
        return ctx
class TransactionListView(loginRequiredMixin, ListView):
    model = Transaction
    template_name = 'transaction/list.html'
    paginate_by = 20

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

class TransactionCreateView(loginRequiredMixin, CreateView):
    model = Transaction
    form_class = TransactionForm
    template_name = 'transaction/form.html'
    success_url = reverse_lazy('wallet:transaction_list')

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)