from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("send-otp/", views.send_otp, name="send-otp"),
    path("verify-otp/", views.verify_otp, name="verify-otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("bootstrap/", views.BootstrapView.as_view(), name="bootstrap"),
    path("logout/", views.logout, name="logout"),
]
