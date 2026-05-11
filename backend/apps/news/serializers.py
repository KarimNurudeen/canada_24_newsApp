from django.utils import timezone
from rest_framework import serializers

from .constants import SECTION_DEFINITIONS
from .models import Article, UserPost


def format_relative_time(value):
    now = timezone.now()
    delta = now - value
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"


class ArticleSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    region_slugs = serializers.SlugRelatedField(many=True, read_only=True, source="regions", slug_field="slug")
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    reposts_count = serializers.SerializerMethodField()
    saves_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    is_reposted = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "external_id",
            "headline",
            "body",
            "category",
            "img_url",
            "source_url",
            "author",
            "published_at",
            "time",
            "is_live",
            "is_updated",
            "source",
            "feed_key",
            "region_slugs",
            "likes_count",
            "dislikes_count",
            "comments_count",
            "reposts_count",
            "saves_count",
            "user_reaction",
            "is_saved",
            "is_reposted",
        ]

    def get_time(self, obj):
        return format_relative_time(obj.published_at)

    def get_likes_count(self, obj):
        return getattr(
            obj,
            "likes_count",
            obj.reactions.filter(reaction_type="like").count(),
        )

    def get_dislikes_count(self, obj):
        return getattr(
            obj,
            "dislikes_count",
            obj.reactions.filter(reaction_type="dislike").count(),
        )

    def get_comments_count(self, obj):
        return getattr(obj, "comments_count", obj.comments.count())

    def get_reposts_count(self, obj):
        return getattr(obj, "reposts_count", obj.reposts.count())

    def get_saves_count(self, obj):
        return getattr(obj, "saves_count", obj.saved_by.count())

    def get_user_reaction(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None
        return getattr(
            obj,
            "user_reaction",
            obj.reactions.filter(user=request.user).values_list("reaction_type", flat=True).first(),
        )

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return getattr(obj, "is_saved", obj.saved_by.filter(user=request.user).exists())

    def get_is_reposted(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return getattr(obj, "is_reposted", obj.reposts.filter(user=request.user).exists())


class SectionSerializer(serializers.Serializer):
    slug = serializers.CharField()
    label = serializers.CharField()
    code = serializers.CharField()
    rss_url = serializers.URLField()


class VideoItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    duration = serializers.CharField(allow_blank=True)
    show_duration = serializers.BooleanField(default=False)
    date = serializers.CharField()
    img_url = serializers.URLField(allow_blank=True)
    is_live = serializers.BooleanField()
    live_text = serializers.CharField(allow_blank=True)
    source_url = serializers.URLField(allow_blank=True, required=False)
    video_url = serializers.URLField(allow_blank=True, required=False)


class UserPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="user.display_name", read_only=True)
    author_email = serializers.CharField(source="user.email", read_only=True)
    time = serializers.SerializerMethodField()

    class Meta:
        model = UserPost
        fields = [
            "id",
            "headline",
            "body",
            "category",
            "img_url",
            "status",
            "created_at",
            "updated_at",
            "time",
            "author_name",
            "author_email",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at", "time", "author_name", "author_email"]

    def validate_headline(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Headline must be at least 10 characters long.")
        return value

    def validate_body(self, value):
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError("Body must be at least 20 characters long.")
        return value

    def get_time(self, obj):
        return format_relative_time(obj.created_at)
