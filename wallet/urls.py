from django.urls import path, include
from . import views

app_name = 'wallet'

# URLs da API (JSON)
api_patterns = [
    path('transactions/', views.TransactionListCreateAPIView.as_view(), name='api_transactions_list'),
    path('accounts/', views.AccountListAPIView.as_view(), name='api_accounts_list'),
    path('categories/', views.CategoryListAPIView.as_view(), name='api_categories_list'),
    # (Adicionaremos as URLs de update/delete da API aqui depois)
]

# URLs dos Templates (HTML)
urlpatterns = [
    # Dashboard
    path('', views.DashboardView.as_view(), name='dashboard'),
    
    # --- CRUD de Transações (HTML) ---
    path('transaction/expense/new/', views.ExpenseCreateView.as_view(), name='expense_create'),
    path('transaction/income/new/', views.IncomeCreateView.as_view(), name='income_create'),
    path('transaction/', views.TransactionListView.as_view(), name='transactions_list'),
    path('transaction/<int:pk>/edit/', views.TransactionUpdateView.as_view(), name='transaction_edit'),
    path('transaction/<int:pk>/delete/', views.TransactionDeleteView.as_view(), name='transaction_delete'),

    # --- CRUD de Contas (HTML) ---
    path('accounts/', views.AccountListView.as_view(), name='account_list'),
    path('accounts/new/', views.AccountCreateView.as_view(), name='account_create'),
    path('accounts/<int:pk>/edit/', views.AccountUpdateView.as_view(), name='account_edit'),
    path('accounts/<int:pk>/delete/', views.AccountDeleteView.as_view(), name='account_delete'),

    # --- CRUD de Categorias (HTML) ---
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    path('categories/new/', views.CategoryCreateView.as_view(), name='category_create'),
    path('categories/<int:pk>/edit/', views.CategoryUpdateView.as_view(), name='category_edit'),
    path('categories/<int:pk>/delete/', views.CategoryDeleteView.as_view(), name='category_delete'),

    # (NOVO) Namespace da API
    path('api/v1/', include(api_patterns)),
]