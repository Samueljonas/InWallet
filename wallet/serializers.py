
from rest_framework import serializers
from .models import Transaction, Category

class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializa o modelo Transaction para JSON e vice-versa.
    """
    
    # Para deixar a API mais amigável, vamos incluir o nome
    # da categoria, não apenas o ID.
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Transaction
        
        # [cite_start]Define quais campos do seu modelo [cite: 1066-1076]
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

        read_only_fields = ['user']