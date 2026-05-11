from django.core.validators import FileExtensionValidator
from django.conf import settings
from django.db import models

from . import video_utils


class Article(models.Model):
    class Source(models.TextChoices):
        RSS = "RSS", "RSS"
        USER = "USER", "User"

    class Category(models.TextChoices):
        GENERAL         = "GENERAL",         "General"
        BUSINESS        = "BUSINESS",        "Business"
        HEALTH          = "HEALTH",          "Health"
        ENTERTAINMENT   = "ENTERTAINMENT",   "Entertainment"
        TECHNOLOGY      = "TECHNOLOGY",      "Technology"
        SPORTS          = "SPORTS",          "Sports"
        IMMIGRATION     = "IMMIGRATION",     "Immigration"
        AVIATION        = "AVIATION",        "Aviation"
        INDIGENOUS      = "INDIGENOUS",      "Indigenous"
        POLITICS        = "POLITICS",        "Politics"
        EVENTS          = "EVENTS",          "Events"
        AUTO_NEWS       = "AUTO_NEWS",       "Auto News"
        BLACKS_IN_CANADA = "BLACKS_IN_CANADA", "Blacks in Canada"
        EDUCATION       = "EDUCATION",       "Education in Canada"
        OPPORTUNITIES   = "OPPORTUNITIES",   "Opportunities"
        WORLD           = "WORLD",           "World"

    external_id  = models.CharField(max_length=255, unique=True)
    headline     = models.CharField(max_length=500)
    body         = models.TextField(blank=True)
    category     = models.CharField(max_length=32, choices=Category.choices, default=Category.GENERAL)
    img_url      = models.URLField(blank=True)
    source_url   = models.URLField(blank=True)
    author       = models.CharField(max_length=255, blank=True)
    published_at = models.DateTimeField()
    is_live      = models.BooleanField(default=False)
    is_updated   = models.BooleanField(default=False)
    source       = models.CharField(max_length=8, choices=Source.choices, default=Source.RSS)
    feed_key     = models.CharField(max_length=64, blank=True, db_index=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    regions      = models.ManyToManyField("regions.Region", blank=True, related_name="articles")

    class Meta:
        db_table = "articles"
        ordering = ["-published_at", "-id"]
        indexes = [
            models.Index(fields=["category", "-published_at"]),
            models.Index(fields=["feed_key", "-published_at"]),
            models.Index(fields=["source", "-published_at"]),
        ]

    def __str__(self):
        return self.headline


# Maps any old category code to one of the 15 canonical ones
CATEGORY_REMAP = {
    "SCIENCE":      "TECHNOLOGY",
    "ENVIRONMENT":  "WORLD",
    "OPINION":      "POLITICS",
    "ARTS":         "ENTERTAINMENT",
    "MUSIC":        "ENTERTAINMENT",
    "JOBS_CAREERS": "OPPORTUNITIES",
    "SCHOLARSHIPS": "OPPORTUNITIES",
    "GRANTS":       "OPPORTUNITIES",
    "REAL_ESTATE":  "GENERAL",
    "TRAVEL":       "GENERAL",
    "FOOD":         "GENERAL",
    "GOVERNMENT":   "POLITICS",
}

VALID_CATEGORIES = {c.value for c in Article.Category}


def canonical_category(code: str) -> str:
    code = (code or "GENERAL").upper()
    code = CATEGORY_REMAP.get(code, code)
    return code if code in VALID_CATEGORIES else "GENERAL"


class UserPost(models.Model):
    class Status(models.TextChoices):
        PENDING  = "PENDING",  "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_posts")
    headline = models.CharField(max_length=500)
    body     = models.TextField()
    category = models.CharField(max_length=32, choices=Article.Category.choices, default=Article.Category.GENERAL)
    img_url  = models.URLField(blank=True)
    status   = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_posts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email}: {self.headline[:60]}"

    @property
    def article_external_id(self):
        return f"user-post-{self.pk}"

    def sync_published_article(self):
        if not self.pk:
            return

        if self.status != self.Status.APPROVED:
            Article.objects.filter(
                external_id=self.article_external_id,
                source=Article.Source.USER,
            ).delete()
            return

        Article.objects.update_or_create(
            external_id=self.article_external_id,
            defaults={
                "headline":     self.headline,
                "body":         self.body,
                "category":     self.category,
                "img_url":      self.img_url,
                "source_url":   "",
                "author":       self.user.display_name,
                "published_at": self.created_at,
                "is_live":      False,
                "is_updated":   False,
                "source":       Article.Source.USER,
                "feed_key":     "community",
            },
        )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.sync_published_article()

    def delete(self, *args, **kwargs):
        article_external_id = self.article_external_id
        super().delete(*args, **kwargs)
        Article.objects.filter(
            external_id=article_external_id,
            source=Article.Source.USER,
        ).delete()


class NewsVideo(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video_file = models.FileField(
        upload_to="news_videos/videos/",
        validators=[FileExtensionValidator(allowed_extensions=["mp4", "mov", "m4v", "webm"])],
        help_text="Upload a local MP4, MOV, M4V, or WebM file from Django admin.",
    )
    thumbnail = models.ImageField(
        upload_to="news_videos/thumbnails/",
        blank=True,
        help_text="Optional thumbnail image. If omitted, the app will show a placeholder card.",
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "news_videos"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        previous = None
        if self.pk:
            previous = type(self).objects.filter(pk=self.pk).values("video_file", "thumbnail").first()

        previous_thumbnail_name = previous["thumbnail"] if previous else ""
        previous_video_name = previous["video_file"] if previous else ""

        super().save(*args, **kwargs)

        thumbnail_name = self.thumbnail.name if self.thumbnail else ""
        video_changed_without_new_thumbnail = (
            bool(previous)
            and previous_video_name != self.video_file.name
            and thumbnail_name == previous_thumbnail_name
        )
        should_generate_thumbnail = bool(self.video_file) and (
            not self.thumbnail or video_changed_without_new_thumbnail
        )

        if not should_generate_thumbnail:
            return

        generated_thumbnail = video_utils.generate_representative_thumbnail(self.video_file, self.title)
        if generated_thumbnail is None:
            return

        self.thumbnail.save(generated_thumbnail.name, generated_thumbnail, save=False)
        super().save(update_fields=["thumbnail", "updated_at"])
