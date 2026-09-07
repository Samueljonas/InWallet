from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from .serializers import UserRegistrationSerializer, UserProfileSerializer

User = get_user_model()


class RegisterAPIView(generics.CreateAPIView):
    """
    Public API endpoint to register a new user.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for the authenticated user to view/update profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
