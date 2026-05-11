from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from .models import Region


class RegionApiTests(APITestCase):
    def test_region_catalog_still_available_when_manage_regions_is_disabled(self):
        Region.objects.create(
            slug="calgary",
            name="Calgary",
            province="Alberta",
            rss_url="https://example.com/calgary.xml",
        )

        response = self.client.get("/api/v1/regions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["slug"], "calgary")

    def test_personal_region_management_endpoint_is_not_exposed_by_default(self):
        user = User.objects.create_user(email="member@example.com", is_verified=True)
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/v1/regions/me/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
