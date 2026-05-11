import shutil
import tempfile
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.interactions.models import Comment, Reaction, Repost, SavedArticle

from .models import Article, NewsVideo, UserPost


class NewsApiTests(APITestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp(prefix="news-test-media-")
        self.override_media = override_settings(MEDIA_ROOT=self.media_root)
        self.override_media.enable()
        self.addCleanup(self.override_media.disable)
        self.addCleanup(lambda: shutil.rmtree(self.media_root, ignore_errors=True))

        self.user = User.objects.create_user(email="reader@example.com", is_verified=True)
        self.article = Article.objects.create(
            external_id="news-article",
            headline="Detailed backend article",
            body="This story body is long enough to exercise the serializer output.",
            category=Article.Category.POLITICS,
            published_at=timezone.now(),
            source=Article.Source.RSS,
            feed_key="top-stories",
        )

    def test_article_list_includes_engagement_summary_and_user_state(self):
        Reaction.objects.create(
            user=self.user,
            article=self.article,
            reaction_type=Reaction.ReactionType.LIKE,
        )
        Comment.objects.create(
            user=self.user,
            article=self.article,
            text="This backend response includes interaction metadata.",
        )
        Repost.objects.create(user=self.user, article=self.article)
        SavedArticle.objects.create(user=self.user, article=self.article)

        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/news/articles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data["results"][0]
        self.assertEqual(item["external_id"], self.article.external_id)
        self.assertEqual(item["likes_count"], 1)
        self.assertEqual(item["dislikes_count"], 0)
        self.assertEqual(item["comments_count"], 1)
        self.assertEqual(item["reposts_count"], 1)
        self.assertEqual(item["saves_count"], 1)
        self.assertEqual(item["user_reaction"], Reaction.ReactionType.LIKE)
        self.assertTrue(item["is_saved"])
        self.assertTrue(item["is_reposted"])

    def test_approved_user_post_syncs_to_article_and_community_feed(self):
        post = UserPost.objects.create(
            user=self.user,
            headline="Community article headline",
            body="This community post is long enough to become a published article.",
            category=Article.Category.BUSINESS,
        )
        self.assertFalse(Article.objects.filter(external_id=f"user-post-{post.pk}").exists())

        post.status = UserPost.Status.APPROVED
        post.save()

        synced_article = Article.objects.get(external_id=f"user-post-{post.pk}")
        self.assertEqual(synced_article.source, Article.Source.USER)
        self.assertEqual(synced_article.feed_key, "community")
        self.assertEqual(synced_article.author, self.user.display_name)

        response = self.client.get("/api/v1/news/community/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["external_id"], synced_article.external_id)

    def test_non_approved_or_deleted_user_post_removes_synced_article(self):
        post = UserPost.objects.create(
            user=self.user,
            headline="Another community headline",
            body="This community post body is long enough to publish and then remove.",
            category=Article.Category.GENERAL,
            status=UserPost.Status.APPROVED,
        )

        synced_external_id = f"user-post-{post.pk}"
        self.assertTrue(Article.objects.filter(external_id=synced_external_id).exists())

        post.status = UserPost.Status.REJECTED
        post.save()
        self.assertFalse(Article.objects.filter(external_id=synced_external_id).exists())

        post.status = UserPost.Status.APPROVED
        post.save()
        self.assertTrue(Article.objects.filter(external_id=synced_external_id).exists())

        post.delete()
        self.assertFalse(Article.objects.filter(external_id=synced_external_id).exists())

    def test_video_feed_is_generated_from_admin_uploaded_videos(self):
        uploaded_video = NewsVideo.objects.create(
            title="Admin uploaded morning briefing",
            description="A short explainer that should render under the trending video card.",
            video_file=SimpleUploadedFile(
                "morning-briefing.mp4",
                b"fake video bytes",
                content_type="video/mp4",
            ),
        )

        response = self.client.get("/api/v1/news/videos/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("trending", response.data)
        self.assertIn("live", response.data)
        self.assertEqual(response.data["live"], [])
        self.assertEqual(len(response.data["trending"]), 1)
        self.assertEqual(response.data["trending"][0]["id"], f"uploaded-video-{uploaded_video.pk}")
        self.assertEqual(response.data["trending"][0]["title"], uploaded_video.title)
        self.assertEqual(response.data["trending"][0]["description"], uploaded_video.description)
        self.assertIn("/media/news_videos/videos/morning-briefing", response.data["trending"][0]["video_url"])
        self.assertEqual(response.data["trending"][0]["img_url"], "")
        media_response = self.client.get(uploaded_video.video_file.url)
        self.assertEqual(media_response.status_code, status.HTTP_200_OK)
        self.assertEqual(b"".join(media_response.streaming_content), b"fake video bytes")

    @patch("apps.news.models.video_utils.generate_representative_thumbnail")
    def test_video_without_thumbnail_gets_auto_generated_thumbnail(self, thumbnail_generator):
        thumbnail_generator.return_value = ContentFile(b"image-bytes", name="auto-thumb.jpg")

        uploaded_video = NewsVideo.objects.create(
            title="Auto thumbnail test",
            video_file=SimpleUploadedFile(
                "auto-thumb.mp4",
                b"fake video bytes",
                content_type="video/mp4",
            ),
        )

        uploaded_video.refresh_from_db()

        self.assertTrue(uploaded_video.thumbnail.name.endswith("auto-thumb.jpg"))
        thumbnail_generator.assert_called_once()

    def test_unpublished_videos_are_hidden_from_video_feed(self):
        NewsVideo.objects.create(
            title="Draft admin upload",
            video_file=SimpleUploadedFile(
                "draft-story.mp4",
                b"fake video bytes",
                content_type="video/mp4",
            ),
            is_published=False,
        )

        response = self.client.get("/api/v1/news/videos/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["trending"], [])
