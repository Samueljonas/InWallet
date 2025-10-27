from django.apps import AppConfig

class WalletConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wallet'

    # ADICIONE ESTE MÉTODO:
    def ready(self):
        import wallet.signals  # Isso ativa os sinais