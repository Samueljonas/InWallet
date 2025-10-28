from django.urls import reverse_lazy
from django.views.generic import CreateView
from .forms import UserSignUpForm

# (NOVO) Importe as views de autenticação que vamos customizar
from django.contrib.auth import views as auth_views


class SignUpView(CreateView):
    form_class = UserSignUpForm
    success_url = reverse_lazy('login') 
    template_name = 'registration/signup.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Criar nova conta'
        return context

# ----------------------------------------------------
# (NOVO) VIEWS PARA MUDANÇA DE SENHA
# ----------------------------------------------------

class UserPasswordChangeView(auth_views.PasswordChangeView):
    """
    Força o Django a usar o nosso template personalizado
    em vez do template do Admin.
    """
    template_name = 'registration/password_change_form.html'
    success_url = reverse_lazy('password_change_done') # URL para onde ir após o sucesso

class UserPasswordChangeDoneView(auth_views.PasswordChangeDoneView):
    """
    Força o Django a usar o nosso template de sucesso personalizado.
    """
    template_name = 'registration/password_change_done.html'