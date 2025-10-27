from django import forms
from .models import Transaction, Category, Account
from django.utils import timezone # Importar timezone

class ExpenseForm(forms.ModelForm):
    """
    Formulário específico para registrar DESPESAS.
    """
    def __init__(self, *args, **kwargs):
        # Pega o 'user' passado pela View
        user = kwargs.pop('user', None) 
        
        super().__init__(*args, **kwargs)
        
        # Filtra o campo 'category' para mostrar APENAS categorias de 'expense'
        # e que pertençam ao usuário logado.
        if user:
            self.fields['category'].queryset = Category.objects.filter(
                user=user, type='expense'
            )
            self.fields['account'].queryset = Account.objects.filter(user=user)
        
        # Define o valor inicial da data para hoje
        self.fields['date'].initial = timezone.now().date()

        # Adiciona classes Bootstrap
        self.fields['date'].widget.attrs.update({'class': 'form-control', 'type': 'date'})
        self.fields['amount'].widget.attrs.update({'class': 'form-control', 'placeholder': '0.00'})
        self.fields['account'].widget.attrs.update({'class': 'form-select'})
        self.fields['category'].widget.attrs.update({'class': 'form-select'})
        
        text_fields = ['description', 'payment_method', 'note']
        for field_name in text_fields:
            if field_name in self.fields:
                self.fields[field_name].widget.attrs.update({'class': 'form-control'})

    def save(self, commit=True):
        # Define o 'type' automaticamente antes de salvar
        instance = super().save(commit=False)
        instance.type = 'expense' # Força o tipo
        if commit:
            instance.save()
        return instance

    class Meta:
        model = Transaction
        # O campo 'type' foi removido, pois é definido no form.
        fields = [
            'account', 
            'category', 
            'amount', 
            'date', 
            'description', 
            'payment_method', 
            'note'
        ]
        widgets = {
            'note': forms.Textarea(attrs={'rows': 2}),
            'date': forms.DateInput(attrs={'type': 'date'}), # Garante o 'type'
        }


class IncomeForm(forms.ModelForm):
    """
    Formulário específico para registrar RECEITAS.
    """
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Filtra o campo 'category' para mostrar APENAS categorias de 'income'
        if user:
            self.fields['category'].queryset = Category.objects.filter(
                user=user, type='income'
            )
            self.fields['account'].queryset = Account.objects.filter(user=user)
        
        # Define o valor inicial da data para hoje
        self.fields['date'].initial = timezone.now().date()

        # Adiciona classes Bootstrap
        self.fields['date'].widget.attrs.update({'class': 'form-control', 'type': 'date'})
        self.fields['amount'].widget.attrs.update({'class': 'form-control', 'placeholder': '0.00'})
        self.fields['account'].widget.attrs.update({'class': 'form-select'})
        self.fields['category'].widget.attrs.update({'class': 'form-select'})
        
        text_fields = ['description', 'payment_method', 'note']
        for field_name in text_fields:
            if field_name in self.fields:
                self.fields[field_name].widget.attrs.update({'class': 'form-control'})

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.type = 'income' # Força o tipo
        if commit:
            instance.save()
        return instance

    class Meta:
        model = Transaction
        fields = [
            'account', 
            'category', 
            'amount', 
            'date', 
            'description', 
            'payment_method', 
            'note'
        ]
        widgets = {
            'note': forms.Textarea(attrs={'rows': 2}),
            'date': forms.DateInput(attrs={'type': 'date'}),
        }