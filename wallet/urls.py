from django.urls import path
from . import views

app_name = 'wallet'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('transactions/', views.TransactionListView.as_view(), name='transactions_list'),
    path('transactions/new/', views.TransactionCreateView.as_view(), name='transactions_create'),
]
