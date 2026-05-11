from django.urls import path

from .views import AlertPreferenceView, PushTokenView

urlpatterns = [
    path("alerts/", AlertPreferenceView.as_view(), name="alerts"),
    path("push-token/", PushTokenView.as_view(), name="push-token"),
]
