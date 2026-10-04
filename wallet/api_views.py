from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import ProtectedError
from django.utils import timezone

from .models import Transaction, Account, Category
from .serializers import (
    TransactionSerializer,
    AccountSerializer,
    CategorySerializer,
    DashboardMetricsSerializer,
)
from .services import TransactionService, DashboardService


class BaseUserFilteredListCreateAPIView(generics.ListCreateAPIView):
    """
    Base generic API view applying user filtering and assignment.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.model.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BaseUserFilteredDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Base generic API view for retrieve, update, delete scoped to user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.model.objects.filter(user=self.request.user)


# --- TRANSACTION API ---

class TransactionListCreateAPIView(BaseUserFilteredListCreateAPIView):
    """
    Lista com filtros opcionais: ?year=2026&month=10&type=expense
    """
    model = Transaction
    serializer_class = TransactionSerializer

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).select_related(
            'category', 'account'
        )
        params = self.request.query_params

        year = params.get('year')
        month = params.get('month')
        tx_type = params.get('type')

        if year and year.isdigit():
            qs = qs.filter(date__year=int(year))
        if month and month.isdigit():
            qs = qs.filter(date__month=int(month))
        if tx_type in ('income', 'expense'):
            qs = qs.filter(type=tx_type)

        return qs.order_by('-date', '-id')


class TransactionDetailAPIView(BaseUserFilteredDetailAPIView):
    model = Transaction
    serializer_class = TransactionSerializer

    def perform_destroy(self, instance):
        # Uses atomic service to safely revert ledger balance
        TransactionService.delete_transaction(instance)


# --- ACCOUNT API ---

class AccountListCreateAPIView(BaseUserFilteredListCreateAPIView):
    model = Account
    serializer_class = AccountSerializer


class AccountDetailAPIView(BaseUserFilteredDetailAPIView):
    model = Account
    serializer_class = AccountSerializer


# --- CATEGORY API ---

class CategoryListCreateAPIView(BaseUserFilteredListCreateAPIView):
    model = Category
    serializer_class = CategorySerializer


class CategoryDetailAPIView(BaseUserFilteredDetailAPIView):
    model = Category
    serializer_class = CategorySerializer

    def perform_destroy(self, instance):
        # Transaction.category usa on_delete=PROTECT: sem isso viraria erro 500.
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                {'detail': 'Esta categoria possui transações e não pode ser excluída.'}
            )


# --- DASHBOARD API ---

class DashboardAPIView(APIView):
    """
    Single Responsibility (SRP):
    Exposes aggregated dashboard data calculated by DashboardService for Mobile/Web.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        try:
            year = int(request.query_params.get('year', now.year))
        except (ValueError, TypeError):
            year = now.year

        try:
            month = int(request.query_params.get('month', now.month))
        except (ValueError, TypeError):
            month = now.month

        data = DashboardService.get_dashboard_data(request.user, year, month)
        serializer = DashboardMetricsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

