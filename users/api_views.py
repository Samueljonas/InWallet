from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction as db_transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
)

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


class PasswordResetRequestAPIView(APIView):
    """
    Endpoint público para solicitação de redefinição de senha via e-mail.
    Gera UID codificado em base64 e token criptográfico temporário do Django.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip()

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        response_payload = {
            'detail': 'Se o e-mail informado estiver cadastrado, você receberá as instruções para redefinir sua senha.'
        }

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            subject = 'Recuperação de Senha — InWallet'
            message = (
                f'Olá, {user.first_name or user.username}.\n\n'
                f'Recebemos uma solicitação para redefinir a senha da sua conta no InWallet.\n'
                f'Utilize os códigos abaixo no aplicativo para criar uma nova senha:\n\n'
                f'Código de Identificação (UID): {uid}\n'
                f'Token de Segurança: {token}\n\n'
                f'Se você não solicitou esta alteração, ignore este e-mail com segurança.'
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@inwallet.app'),
                recipient_list=[user.email],
                fail_silently=True,
            )

            if settings.DEBUG:
                response_payload['debug_reset'] = {
                    'uid': uid,
                    'token': token,
                }

        return Response(response_payload, status=status.HTTP_200_OK)


class PasswordResetConfirmAPIView(APIView):
    """
    Endpoint público para confirmar a redefinição de senha utilizando UID e Token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid'].strip()
        token = serializer.validated_data['token'].strip()
        new_password = serializer.validated_data['new_password']

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is None or not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Código ou token de recuperação inválido ou expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response(
                {'new_password': list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {'detail': 'Sua senha foi redefinida com sucesso.'},
            status=status.HTTP_200_OK,
        )


class PasswordChangeAPIView(APIView):
    """
    Endpoint autenticado para alteração de senha pelo próprio titular da conta.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response(
                {'old_password': ['A senha atual informada está incorreta.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response(
                {'new_password': list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {'detail': 'Senha alterada com sucesso.'},
            status=status.HTTP_200_OK,
        )



