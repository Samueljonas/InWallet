from rest_framework import permissions


class IsProUser(permissions.BasePermission):
    """
    Permissão que exige plano Pro ativo.
    """
    message = "Este recurso é exclusivo do plano Pro. Faça upgrade para desbloquear."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        if not profile:
            from users.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return profile.is_pro

