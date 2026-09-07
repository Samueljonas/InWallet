from rest_framework import serializers
from .models import Transaction, Account, Category
from .services import TransactionService, DashboardService


class AccountSerializer(serializers.ModelSerializer):
    """
    Interface Segregation (ISP):
    Focused serializer for Account entities.
    """
    class Meta:
        model = Account
        fields = ['id', 'name', 'balance']
        read_only_fields = ['balance']


class CategorySerializer(serializers.ModelSerializer):
    """
    Interface Segregation (ISP):
    Focused serializer for Category entities.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'type']


class TransactionSerializer(serializers.ModelSerializer):
    """
    Dependency Inversion (DIP) & Single Responsibility (SRP):
    Delegates atomic database writes and balance recalculations to TransactionService.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'account',
            'account_name',
            'category',
            'category_name',
            'type',
            'amount',
            'date',
            'description',
            'payment_method',
            'note',
            'user',
        ]
        read_only_fields = ['user']

    def validate_account(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated and value.user != request.user:
            raise serializers.ValidationError("Esta conta não pertence ao usuário autenticado.")
        return value

    def validate_category(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated and value.user != request.user:
            raise serializers.ValidationError("Esta categoria não pertence ao usuário autenticado.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        return TransactionService.create_transaction(
            user=user,
            account=validated_data['account'],
            category=validated_data['category'],
            tx_type=validated_data['type'],
            amount=validated_data['amount'],
            date=validated_data['date'],
            description=validated_data.get('description', ''),
            payment_method=validated_data.get('payment_method', ''),
            note=validated_data.get('note', ''),
        )

    def update(self, instance, validated_data):
        return TransactionService.update_transaction(
            transaction=instance,
            **validated_data
        )


class DashboardMetricsSerializer(serializers.Serializer):
    """
    Interface Segregation (ISP):
    Exposes clean aggregated metrics for mobile and web clients.
    """
    selected_year = serializers.IntegerField()
    selected_month = serializers.IntegerField()
    total_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    monthly_income = serializers.DecimalField(max_digits=14, decimal_places=2)
    monthly_expense = serializers.DecimalField(max_digits=14, decimal_places=2)
    monthly_net = serializers.DecimalField(max_digits=14, decimal_places=2)
    expenses_by_category = serializers.ListField()
    monthly_summary = serializers.ListField()