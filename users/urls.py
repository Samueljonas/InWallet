from django.urls import path, include
from .views import SignUpView
from . import views # Importe as views que acabamos de criar

urlpatterns = [
    # Nossa nova view de cadastro
    path('signup/', SignUpView.as_view(), name='signup'),

    # --- (NOVAS URLS EXPLÍCITAS) ---
    # Define as URLs de "mudar senha" ANTES do include padrão.
    # Isso força o Django a usar nossas views (e nossos templates).
    path(
        'password_change/', 
        views.UserPasswordChangeView.as_view(), 
        name='password_change'
    ),
    path(
        'password_change/done/', 
        views.UserPasswordChangeDoneView.as_view(), 
        name='password_change_done'
    ),
    
    # Inclui o resto das views padrão do Django
    # (login, logout, password_reset, etc.)
    # O Django ainda vai procurar os templates em 'registration/...' para elas.
    path('', include('django.contrib.auth.urls')),
]