from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from .models import AlertPreference


class NotificationApiTests(APITestCase):
    def test_patch_updates_single_alert_preference(self):
        user = User.objects.create_user(email="alerts@example.com", is_verified=True)
        AlertPreference.objects.create(user=user, breaking_news=True, business=False)

        self.client.force_authenticate(user=user)
        response = self.client.patch(
            "/api/v1/notifications/alerts/",
            {"business": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["business"])
        self.assertTrue(response.data["breaking_news"])
