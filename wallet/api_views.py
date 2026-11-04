from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import ProtectedError, Q
from django.utils import timezone

from .models import Transaction, Account, Category, Budget
from .permissions import IsProUser
from .serializers import (
    TransactionSerializer,
    AccountSerializer,
    CategorySerializer,
    BudgetSerializer,
    DashboardMetricsSerializer,
)
from .services import TransactionService, DashboardService, StatementImportService


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
    Lista com filtros opcionais: ?year=2026&month=10&type=expense&account=1&category=2&search=mercado
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
        account_id = params.get('account')
        category_id = params.get('category')
        search = params.get('search', '').strip()

        if year and year.isdigit():
            qs = qs.filter(date__year=int(year))
        if month and month.isdigit():
            qs = qs.filter(date__month=int(month))
        if tx_type in ('income', 'expense'):
            qs = qs.filter(type=tx_type)
        if account_id and account_id.isdigit():
            qs = qs.filter(account_id=int(account_id))
        if category_id and category_id.isdigit():
            qs = qs.filter(category_id=int(category_id))
        if search:
            qs = qs.filter(
                Q(description__icontains=search)
                | Q(category__name__icontains=search)
                | Q(account__name__icontains=search)
                | Q(note__icontains=search)
            )

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
        if Transaction.objects.filter(category=instance).exists():
            raise ValidationError(
                {'detail': 'Esta categoria possui transações e não pode ser excluída.'}
            )
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                {'detail': 'Esta categoria possui transações e não pode ser excluída.'}
            )


# --- BUDGET API ---

class BudgetListCreateAPIView(BaseUserFilteredListCreateAPIView):
    model = Budget
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsProUser]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related('category')


class BudgetDetailAPIView(BaseUserFilteredDetailAPIView):
    model = Budget
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsProUser]



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


class StatementImportAPIView(APIView):
    """
    Endpoint para importação de extratos bancários nos formatos OFX e CSV.
    Suporta envio via JSON ({ account, filename, content }) ou Multipart Form ({ account, file }).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        account_id = request.data.get('account')
        if not account_id:
            return Response(
                {'detail': 'Selecione a conta bancária de destino para a importação.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account = Account.objects.filter(pk=account_id, user=request.user).first()
        if not account:
            return Response(
                {'detail': 'Conta bancária inválida ou não pertencente ao usuário.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        uploaded_file = request.FILES.get('file')
        if uploaded_file:
            filename = uploaded_file.name
            raw_bytes = uploaded_file.read()
            try:
                content = raw_bytes.decode('utf-8')
            except UnicodeDecodeError:
                content = raw_bytes.decode('latin-1', errors='ignore')
        else:
            filename = str(request.data.get('filename', 'extrato.csv'))
            content = str(request.data.get('content', '')).strip()

        if not content:
            return Response(
                {'detail': 'O conteúdo do arquivo de extrato está vazio.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = StatementImportService.import_statement(
            user=request.user,
            account=account,
            filename=filename,
            content=content,
        )
        return Response(result, status=status.HTTP_200_OK)


class HealthCheckAPIView(APIView):
    """
    Endpoint público de monitoramento e prontidão para deploy (Docker / Cloud Load Balancers).
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def get(self, request, *args, **kwargs):
        from django.db import connection
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_ok = False

        http_status = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(
            {
                'status': 'ok' if db_ok else 'degraded',
                'database': 'connected' if db_ok else 'unreachable',
                'service': 'inwallet-api',
                'version': '1.0.0',
            },
            status=http_status,
        )


