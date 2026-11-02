from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserRegistrationSerializer, UserProfileSerializer

User = get_user_model()


class RegisterAPIView(generics.CreateAPIView):
    """
    Public API endpoint to register a new user.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserProfileAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for the authenticated user to view/update/delete profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class DeleteAccountAPIView(APIView):
    """
    Endpoint para exclusão definitiva da conta do titular e todos os dados
    vinculados em cascata (Art. 18, VI da LGPD e diretrizes da Play Store / App Store).
    """
    permission_classes = [permissions.IsAuthenticated]

    @db_transaction.atomic
    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpgradePlanAPIView(APIView):
    """
    Endpoint para ativação/renovação do plano PRO do usuário.
    Na Fase 4 este fluxo é acionado ou validado pelo Webhook do Gateway (Stripe/Asaas).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from datetime import timedelta
        from django.utils import timezone
        from .models import UserProfile

        period = request.data.get('period', 'yearly')
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        days = 365 if period == 'yearly' else 30
        profile.plan = 'pro'
        profile.plan_expires_at = timezone.now() + timedelta(days=days)
        profile.save()

        return Response({
            'status': 'success',
            'plan': profile.plan,
            'plan_expires_at': profile.plan_expires_at,
            'is_pro': profile.is_pro,
        }, status=status.HTTP_200_OK)


