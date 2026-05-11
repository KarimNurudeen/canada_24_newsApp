from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import OTPVerification, User
from apps.interactions.models import SavedArticle
from apps.news.models import Article, UserPost
from apps.notifications.models import AlertPreference
from apps.regions.models import Region, UserRegion


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthApiTests(APITestCase):
    def test_send_and_verify_otp_authenticates_user(self):
        email = "reader@example.com"

        send_response = self.client.post(
            "/api/v1/auth/send-otp/",
            {"email": email},
            format="json",
        )
        self.assertEqual(send_response.status_code, status.HTTP_200_OK)
        self.assertEqual(send_response.data["detail"], "Verification code sent.")
        self.assertEqual(len(mail.outbox), 1)

        otp = OTPVerification.objects.get(email=email, is_used=False)
        otp.set_code("123456")
        otp.save(update_fields=["code"])

        verify_response = self.client.post(
            "/api/v1/auth/verify-otp/",
            {"email": email, "code": "123456"},
            format="json",
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", verify_response.data)
        self.assertIn("refresh", verify_response.data)
        self.assertTrue(verify_response.data["is_new_user"])
        self.assertEqual(verify_response.data["user"]["email"], email)

        user = User.objects.get(email=email)
        self.assertTrue(user.is_verified)

        otp.refresh_from_db()
        self.assertTrue(otp.is_used)

    def test_bootstrap_returns_authenticated_app_state(self):
        user = User.objects.create_user(email="member@example.com", is_verified=True)
        region = Region.objects.first()
        if region is None:
            region = Region.objects.create(
                slug="toronto",
                name="Toronto",
                province="Ontario",
                rss_url="https://example.com/rss",
            )

        article = Article.objects.create(
            external_id="bootstrap-article",
            headline="Bootstrap article headline",
            body="Bootstrap article body for saved stories.",
            category=Article.Category.GENERAL,
            published_at=timezone.now(),
            source=Article.Source.RSS,
            feed_key="top-stories",
        )
        SavedArticle.objects.create(user=user, article=article)
        AlertPreference.objects.create(user=user, business=True, sports=True)
        UserRegion.objects.create(user=user, region=region)
        UserPost.objects.create(
            user=user,
            headline="Community headline from bootstrap",
            body="This is a full community story body for bootstrap coverage.",
            category=Article.Category.GENERAL,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/auth/bootstrap/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], user.email)
        self.assertEqual(response.data["region_slugs"], [region.slug])
        self.assertEqual(len(response.data["regions"]), 1)
        self.assertTrue(response.data["alerts"]["business"])
        self.assertTrue(response.data["alerts"]["sports"])
        self.assertEqual(len(response.data["saved_articles"]), 1)
        self.assertEqual(response.data["saved_articles"][0]["external_id"], "bootstrap-article")
        self.assertEqual(len(response.data["my_posts"]), 1)
        self.assertEqual(response.data["my_posts"][0]["author_email"], user.email)
