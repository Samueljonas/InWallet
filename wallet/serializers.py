from rest_framework import serializers
# 1. Importe todos os três modelos
from .models import Transaction, Account, Category 

class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializa o modelo Transaction para JSON e vice-versa.
    """
    # Para deixar a API mais amigável, vamos incluir o nome
    # da categoria, não apenas o ID.
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Transaction
        
        # Define quais campos do seu modelo
        # serão expostos na API.
        fields = [
            'id', 
            'account', 
            'category', 
            'category_name', # Nosso campo extra
            'type', 
            'amount', 
            'date', 
            'description', 
            'payment_method', 
            'note',
            'user' # Incluímos o 'user' para referência
        ]
        
        # O 'user' não deve ser definido pelo cliente (React),
        # e sim pela view (baseado na sessão), então é 'read_only'.
        read_only_fields = ['user']


class AccountSerializer(serializers.ModelSerializer):
    """
    Serializa o modelo Account.
    O React usará isso para preencher os dropdowns de "Conta".
    """
    class Meta:
        model = Account
        fields = ['id', 'name', 'balance']
        
        # O saldo (balance) é 'read_only' pela API, pois é controlado
        # pelos Signals. O React não deve poder mudá-lo diretamente.
        read_only_fields = ['balance']


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializa o modelo Category.
    O React usará isso para preencher os dropdowns de "Categoria".
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'type']