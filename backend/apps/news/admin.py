from django.contrib import admin
from django.utils.html import format_html

from .models import Article, NewsVideo, UserPost


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("headline", "category", "feed_key", "source", "published_at", "is_live", "is_updated")
    list_filter = ("category", "feed_key", "source", "is_live", "is_updated")
    search_fields = ("headline", "external_id", "author")
    filter_horizontal = ("regions",)


@admin.register(UserPost)
class UserPostAdmin(admin.ModelAdmin):
    list_display = ("headline", "user", "category", "status", "created_at")
    list_filter = ("category", "status")
    search_fields = ("headline", "user__email", "user__display_name")


@admin.register(NewsVideo)
class NewsVideoAdmin(admin.ModelAdmin):
    list_display = ("title", "short_description", "is_published", "has_thumbnail", "created_at")
    list_filter = ("is_published", "created_at")
    search_fields = ("title", "description")
    fields = ("title", "description", "video_file", "thumbnail", "thumbnail_preview", "is_published")
    readonly_fields = ("thumbnail_preview",)

    @admin.display(boolean=True, description="Thumbnail")
    def has_thumbnail(self, obj):
        return bool(obj.thumbnail)

    @admin.display(description="Description")
    def short_description(self, obj):
        text = (obj.description or "").strip()
        if not text:
            return "—"
        return text[:60] + ("..." if len(text) > 60 else "")

    @admin.display(description="Thumbnail Preview")
    def thumbnail_preview(self, obj):
        if not obj.pk:
            return "Saved videos auto-generate a thumbnail if one is not uploaded."
        if not obj.thumbnail:
            return "No thumbnail yet. Save the video to auto-generate one from the video file."
        return format_html(
            '<img src="{}" style="max-width: 240px; border-radius: 8px; border: 1px solid #ddd;" />',
            obj.thumbnail.url,
        )
