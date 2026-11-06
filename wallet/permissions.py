from rest_framework import permissions
from users.models import is_user_pro


class IsProUser(permissions.BasePermission):
    """
    Permissão DRF que restringe endpoints exclusivos aos assinantes InWallet PRO.
    Reutiliza o helper centralizado `is_user_pro(user)` (princípio DRY).
    """
    message = "Este recurso é exclusivo do plano Pro. Faça upgrade para desbloquear."

    def has_permission(self, request, view):
        return is_user_pro(request.user)
