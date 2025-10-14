from django import forms
from .models import Transaction

class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ['account', 'category', 'type', 'amount', 'date', 'description', 'payment_method', 'note']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'description': forms.TextInput(attrs={'placeholder': 'Descrição (opcional)'}),
            'payment_method': forms.TextInput(attrs={'placeholder': 'Método de pagamento (opcional)'}),
            'note': forms.Textarea(attrs={'rows':2}),
        }