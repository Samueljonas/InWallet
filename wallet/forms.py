from django import forms
from .models import Transaction, Category, Account
from django.utils import timezone # Importar timezone
from django.forms.widgets import NumberInput

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
class AccountForm(forms.ModelForm):
    """
    Formulário para criar e editar Contas.
    """
    
    # Renomeia o campo 'balance' para 'Saldo Inicial' no formulário
    balance = forms.DecimalField(
        label='Saldo Inicial', 
        decimal_places=2, 
        max_digits=14,
        help_text="Defina o saldo atual desta conta. (Ex: 1500.00)"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Adiciona classes Bootstrap
        self.fields['name'].widget.attrs.update({'class': 'form-control'})
        self.fields['balance'].widget.attrs.update({'class': 'form-control'})
        
        # LÓGICA ESPECIAL:
        # Se estiver editando (self.instance.pk existe), desabilita o campo 'balance'.
        # O saldo só pode ser alterado por transações.
        if self.instance.pk:
            self.fields['balance'].widget.attrs['disabled'] = True
            self.fields['balance'].widget.attrs['title'] = 'O saldo só pode ser alterado via transações.'
            self.fields['balance'].help_text = 'O saldo não pode ser editado diretamente.'

    class Meta:
        model = Account
        fields = ['name', 'balance']


class CategoryForm(forms.ModelForm):
    """
    Formulário para criar e editar Categorias.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Adiciona classes Bootstrap
        self.fields['name'].widget.attrs.update({'class': 'form-control'})
        self.fields['type'].widget.attrs.update({'class': 'form-select'})

    class Meta:
        model = Category
        fields = ['name', 'type']