import os
import uuid

from django.core.files.storage import default_storage
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .constants import SECTION_BY_SLUG, SECTION_DEFINITIONS
from .models import Article, NewsVideo, UserPost
from .querysets import annotate_article_queryset
from .serializers import (
    ArticleSerializer,
    SectionSerializer,
    UserPostSerializer,
    VideoItemSerializer,
    format_relative_time,
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


def build_uploaded_video_item(video: NewsVideo, request) -> dict:
    thumbnail_url = request.build_absolute_uri(video.thumbnail.url) if video.thumbnail else ""
    video_url = request.build_absolute_uri(video.video_file.url)

    return {
        "id": f"uploaded-video-{video.pk}",
        "title": video.title,
        "description": video.description,
        "duration": "",
        "show_duration": False,
        "date": format_relative_time(video.created_at),
        "img_url": thumbnail_url,
        "is_live": False,
        "live_text": "",
        "source_url": "",
        "video_url": video_url,
    }


class SearchThrottle(AnonRateThrottle):
    scope = "search"


class ArticleListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleSerializer
    filterset_fields = ["category", "source", "is_live", "is_updated", "feed_key", "regions__slug"]
    search_fields = ["headline", "body", "author"]
    ordering_fields = ["published_at", "headline"]
    ordering = ["-published_at"]

    def get_queryset(self):
        queryset = Article.objects.prefetch_related("regions").all()
        return annotate_article_queryset(queryset, user=self.request.user)


class ArticleDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        queryset = Article.objects.prefetch_related("regions").all()
        return annotate_article_queryset(queryset, user=self.request.user)


class TopStoriesView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        queryset = Article.objects.prefetch_related("regions").order_by("-published_at", "-id")
        return annotate_article_queryset(queryset, user=self.request.user)


class LocalNewsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        raw_regions = self.request.query_params.get("regions", "")
        slugs = [slug.strip() for slug in raw_regions.split(",") if slug.strip()]
        if not slugs and self.request.user.is_authenticated:
            slugs = list(
                self.request.user.user_regions.select_related("region").values_list("region__slug", flat=True)
            )

        queryset = Article.objects.prefetch_related("regions").order_by("-published_at")
        if slugs:
            queryset = queryset.filter(regions__slug__in=slugs).distinct()
            if queryset.exists():
                return annotate_article_queryset(queryset, user=self.request.user)
        return annotate_article_queryset(
            queryset,
            user=self.request.user,
        )


class SectionListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        serializer = SectionSerializer(SECTION_DEFINITIONS, many=True)
        return Response(serializer.data)


class SectionArticleListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        section = SECTION_BY_SLUG.get(self.kwargs["slug"])
        if section is None:
            return Article.objects.none()
        queryset = Article.objects.prefetch_related("regions").filter(category=section["code"]).order_by("-published_at")
        return annotate_article_queryset(queryset, user=self.request.user)


class ArticleSearchView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchThrottle]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        queryset = Article.objects.prefetch_related("regions").order_by("-published_at")
        if not query:
            return queryset.none()
        queryset = queryset.filter(
            Q(headline__icontains=query)
            | Q(body__icontains=query)
            | Q(author__icontains=query)
        )
        return annotate_article_queryset(queryset, user=self.request.user)


class CommunityArticleListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        queryset = (
            Article.objects.prefetch_related("regions")
            .filter(source=Article.Source.USER, feed_key="community")
            .order_by("-published_at", "-id")
        )
        return annotate_article_queryset(queryset, user=self.request.user)


class VideoListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        trending_videos = list(NewsVideo.objects.filter(is_published=True)[:10])

        payload = {
            "trending": VideoItemSerializer(
                [build_uploaded_video_item(video, request) for video in trending_videos],
                many=True,
            ).data,
            "live": [],
        }
        return Response(payload)


class UserPostListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserPostSerializer

    def get_queryset(self):
        return UserPost.objects.select_related("user").filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status=UserPost.Status.PENDING)


class UserPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = UserPost.objects.select_related("user")
        if self.request.method in permissions.SAFE_METHODS:
            if self.request.user.is_authenticated:
                return queryset.filter(Q(status=UserPost.Status.APPROVED) | Q(user=self.request.user))
            return queryset.filter(status=UserPost.Status.APPROVED)
        return queryset.filter(user=self.request.user)


class ImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("image")
        if not file:
            return Response({"detail": "No image provided. Send as multipart field 'image'."}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > MAX_IMAGE_BYTES:
            return Response({"detail": "Image must be under 10 MB."}, status=status.HTTP_400_BAD_REQUEST)

        content_type = getattr(file, "content_type", "") or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            return Response({"detail": "Unsupported image type. Use JPEG, PNG, GIF, or WebP."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from PIL import Image as PILImage
            img = PILImage.open(file)
            img.verify()
            file.seek(0)
        except Exception:
            return Response({"detail": "File is not a valid image."}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower() or ".jpg"
        safe_ext = ext if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"} else ".jpg"
        filename = f"uploads/{uuid.uuid4().hex}{safe_ext}"
        saved_path = default_storage.save(filename, file)
        url = request.build_absolute_uri(f"/media/{saved_path}")

        return Response({"url": url}, status=status.HTTP_201_CREATED)
