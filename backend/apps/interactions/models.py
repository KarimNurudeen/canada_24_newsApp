from django.conf import settings
from django.db import models

from apps.news.models import Article


class Reaction(models.Model):
    class ReactionType(models.TextChoices):
        LIKE = "like", "Like"
        DISLIKE = "dislike", "Dislike"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reactions")
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="reactions")
    reaction_type = models.CharField(max_length=10, choices=ReactionType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reactions"
        constraints = [
            models.UniqueConstraint(fields=["user", "article"], name="unique_user_article_reaction"),
        ]


class Comment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comments"
        ordering = ["-created_at"]


class Repost(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reposts")
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="reposts")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reposts"
        constraints = [
            models.UniqueConstraint(fields=["user", "article"], name="unique_user_article_repost"),
        ]


class SavedArticle(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_articles")
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="saved_by")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_articles"
        constraints = [
            models.UniqueConstraint(fields=["user", "article"], name="unique_user_saved_article"),
        ]
        ordering = ["-saved_at"]
