from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import SignUpView, UserPasswordChangeView, UserPasswordChangeDoneView
from . import api_views

app_name = 'users'

# REST API Auth Patterns for Mobile & Web
api_auth_patterns = [
    path('register/', api_views.RegisterAPIView.as_view(), name='api_register'),
    path('me/', api_views.CurrentUserProfileAPIView.as_view(), name='api_me'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns = [
    # API endpoints
    path('api/v1/auth/', include((api_auth_patterns, 'auth_api'), namespace='auth_api')),

    # Template-based signup
    path('signup/', SignUpView.as_view(), name='signup'),

    # Template-based password change
    path('password_change/', UserPasswordChangeView.as_view(), name='password_change'),
    path('password_change/done/', UserPasswordChangeDoneView.as_view(), name='password_change_done'),

    # Django built-in auth views
    path('', include('django.contrib.auth.urls')),
]