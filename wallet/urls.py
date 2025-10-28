from django.urls import path
from . import views

app_name = 'wallet'

urlpatterns = [
    # Dashboard
    path('', views.DashboardView.as_view(), name='dashboard'),
    
    # --- CRUD de Transações ---
    
    # Create (C)
    path('transaction/expense/new/', views.ExpenseCreateView.as_view(), name='expense_create'),
    path('transaction/income/new/', views.IncomeCreateView.as_view(), name='income_create'),
    
    # Read (R) - A Lista
    path('transaction/', views.TransactionListView.as_view(), name='transaction_list'),
    
    # Update (U)
    path('transaction/<int:pk>/edit/', views.TransactionUpdateView.as_view(), name='transaction_edit'),
    
    # Delete (D)
    path('transaction/<int:pk>/delete/', views.TransactionDeleteView.as_view(), name='transaction_delete'),
]