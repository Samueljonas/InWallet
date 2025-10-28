from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('users.urls')),
    path('', include('wallet.urls')),
    path('', RedirectView.as_view(pattern_name='wallet:dashboard', permanent=False)),
]
