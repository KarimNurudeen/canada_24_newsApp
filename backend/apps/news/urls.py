from django.urls import path

from .views import (
    ArticleDetailView,
    ArticleListView,
    ArticleSearchView,
    CommunityArticleListView,
    ImageUploadView,
    LocalNewsView,
    SectionArticleListView,
    SectionListView,
    TopStoriesView,
    UserPostDetailView,
    UserPostListCreateView,
    VideoListView,
)

urlpatterns = [
    path("articles/", ArticleListView.as_view(), name="article-list"),
    path("articles/<int:pk>/", ArticleDetailView.as_view(), name="article-detail"),
    path("top-stories/", TopStoriesView.as_view(), name="top-stories"),
    path("local/", LocalNewsView.as_view(), name="local-news"),
    path("community/", CommunityArticleListView.as_view(), name="community-articles"),
    path("sections/", SectionListView.as_view(), name="section-list"),
    path("sections/<slug:slug>/", SectionArticleListView.as_view(), name="section-articles"),
    path("search/", ArticleSearchView.as_view(), name="article-search"),
    path("videos/", VideoListView.as_view(), name="video-list"),
    path("posts/", UserPostListCreateView.as_view(), name="user-post-list-create"),
    path("posts/<int:pk>/", UserPostDetailView.as_view(), name="user-post-detail"),
    path("upload-image/", ImageUploadView.as_view(), name="upload-image"),
]
