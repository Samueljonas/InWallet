from django.urls import path
from . import views

app_name = 'wallet'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    
    # Caminho singular, como você definiu
    path('transaction/', views.TransactionListView.as_view(), name='transactions_list'),
    
    # Caminhos singulares
    path('transaction/expense/new/', views.ExpenseCreateView.as_view(), name='expense_create'),
    path('transaction/income/new/', views.IncomeCreateView.as_view(), name='income_create'),
]