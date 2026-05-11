from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.news.models import Article

from .models import Comment, Reaction, Repost


class InteractionApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="reader@example.com", is_verified=True)
        self.other_user = User.objects.create_user(email="other@example.com", is_verified=True)
        self.article = Article.objects.create(
            external_id="interaction-article",
            headline="Backend interaction summary story",
            body="This article exists to verify likes, comments, and repost counts.",
            category=Article.Category.GENERAL,
            published_at=timezone.now(),
            source=Article.Source.RSS,
            feed_key="top-stories",
        )

    def test_reaction_summary_includes_comment_and_repost_counts(self):
        Reaction.objects.create(
            user=self.user,
            article=self.article,
            reaction_type=Reaction.ReactionType.LIKE,
        )
        Comment.objects.create(
            user=self.user,
            article=self.article,
            text="First public comment",
        )
        Comment.objects.create(
            user=self.other_user,
            article=self.article,
            text="Second public comment",
        )
        Repost.objects.create(user=self.other_user, article=self.article)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/v1/interactions/articles/{self.article.pk}/reactions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["likes"], 1)
        self.assertEqual(response.data["dislikes"], 0)
        self.assertEqual(response.data["comments"], 2)
        self.assertEqual(response.data["reposts"], 1)
        self.assertEqual(response.data["user_reaction"], Reaction.ReactionType.LIKE)

    def test_repost_toggle_returns_updated_total(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(f"/api/v1/interactions/articles/{self.article.pk}/repost/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["reposted"])
        self.assertEqual(response.data["reposts"], 1)

        response = self.client.post(f"/api/v1/interactions/articles/{self.article.pk}/repost/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["reposted"])
        self.assertEqual(response.data["reposts"], 0)
