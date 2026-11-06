from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserProfile

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer público para cadastro de novos usuários via API Mobile & Web.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value.strip()).exists():
            raise serializers.ValidationError("Um usuário com este e-mail já existe.")
        return value.strip().lower()

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer do perfil autenticado (`/accounts/api/v1/auth/me/`), incluindo
    metadados completos do plano de assinatura (Free/Pro, ciclo e status de renovação).
    """
    is_pro = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    billing_cycle = serializers.SerializerMethodField()
    plan_expires_at = serializers.SerializerMethodField()
    cancel_at_period_end = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_pro',
            'plan',
            'billing_cycle',
            'plan_expires_at',
            'cancel_at_period_end',
        ]
        read_only_fields = [
            'id',
            'username',
            'is_pro',
            'plan',
            'billing_cycle',
            'plan_expires_at',
            'cancel_at_period_end',
        ]

    def get_profile(self, obj) -> UserProfile:
        profile = getattr(obj, 'profile', None)
        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(user=obj)
        return profile

    def get_is_pro(self, obj) -> bool:
        return self.get_profile(obj).is_pro

    def get_plan(self, obj) -> str:
        return self.get_profile(obj).plan

    def get_billing_cycle(self, obj) -> str:
        return self.get_profile(obj).billing_cycle

    def get_plan_expires_at(self, obj):
        return self.get_profile(obj).plan_expires_at

    def get_cancel_at_period_end(self, obj) -> bool:
        return self.get_profile(obj).cancel_at_period_end


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer para solicitação de recuperação de senha via e-mail.
    """
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer para confirmação de redefinição de senha via token/UID.
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer para alteração de senha de usuário autenticado.
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
