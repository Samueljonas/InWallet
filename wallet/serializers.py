from rest_framework import serializers
from .models import Transaction, Account, Category
from .services import TransactionService, DashboardService


class AccountSerializer(serializers.ModelSerializer):
    """
    Interface Segregation (ISP):
    Focused serializer for Account entities.

    O saldo pode ser informado apenas na criação (saldo inicial). Depois disso,
    só muda via transações, para não quebrar o ledger.
    """
    class Meta:
        model = Account
        fields = ['id', 'name', 'balance']
        extra_kwargs = {'balance': {'required': False}}

    def update(self, instance, validated_data):
        validated_data.pop('balance', None)
        return super().update(instance, validated_data)


class CategorySerializer(serializers.ModelSerializer):
    """
    Interface Segregation (ISP):
    Focused serializer for Category entities.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'type']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            name = attrs.get('name', getattr(self.instance, 'name', None))
            cat_type = attrs.get('type', getattr(self.instance, 'type', None))
            duplicates = Category.objects.filter(
                user=request.user, name__iexact=name, type=cat_type
            )
            if self.instance:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError(
                    {'name': 'Você já possui uma categoria com esse nome e tipo.'}
                )
        return attrs


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