from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.news.models import Article
from apps.news.serializers import ArticleSerializer

from .models import Comment, Reaction, Repost, SavedArticle
from .serializers import CommentSerializer, ReactionSummarySerializer, ReactionToggleSerializer


class ReactionToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = ReactionToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        article = generics.get_object_or_404(Article, pk=pk)
        reaction_type = serializer.validated_data["reaction_type"]

        reaction = Reaction.objects.filter(user=request.user, article=article).first()
        if reaction and reaction.reaction_type == reaction_type:
            reaction.delete()
            current_reaction = None
        elif reaction:
            reaction.reaction_type = reaction_type
            reaction.save(update_fields=["reaction_type", "updated_at"])
            current_reaction = reaction.reaction_type
        else:
            reaction = Reaction.objects.create(user=request.user, article=article, reaction_type=reaction_type)
            current_reaction = reaction.reaction_type

        summary = _reaction_summary(article, request.user, current_reaction)
        _broadcast_reaction(article.pk, summary)
        return Response(summary)


class ReactionSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        article = generics.get_object_or_404(Article, pk=pk)
        current_reaction = None
        if request.user.is_authenticated:
            current_reaction = Reaction.objects.filter(user=request.user, article=article).values_list("reaction_type", flat=True).first()
        return Response(_reaction_summary(article, request.user if request.user.is_authenticated else None, current_reaction))


class ArticleCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        article = generics.get_object_or_404(Article, pk=self.kwargs["pk"])
        return Comment.objects.select_related("user", "article").filter(article=article)

    def perform_create(self, serializer):
        article = generics.get_object_or_404(Article, pk=self.kwargs["pk"])
        serializer.save(user=self.request.user, article=article)


class CommentDeleteView(generics.DestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(user=self.request.user)


class RepostToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        article = generics.get_object_or_404(Article, pk=pk)
        repost = Repost.objects.filter(user=request.user, article=article).first()
        if repost:
            repost.delete()
            reposted = False
        else:
            Repost.objects.create(user=request.user, article=article)
            reposted = True
        reposts = Repost.objects.filter(article=article).count()
        return Response({"reposted": reposted, "reposts": reposts})


class SaveToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        article = generics.get_object_or_404(Article, pk=pk)
        saved = SavedArticle.objects.filter(user=request.user, article=article).first()
        if saved:
            saved.delete()
            is_saved = False
        else:
            SavedArticle.objects.create(user=request.user, article=article)
            is_saved = True
        return Response({"saved": is_saved})


class SavedArticleListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        return Article.objects.filter(saved_by__user=self.request.user).order_by("-saved_by__saved_at")


def _reaction_summary(article, user=None, current_reaction=None):
    likes = Reaction.objects.filter(article=article, reaction_type=Reaction.ReactionType.LIKE).count()
    dislikes = Reaction.objects.filter(article=article, reaction_type=Reaction.ReactionType.DISLIKE).count()
    comments = Comment.objects.filter(article=article).count()
    reposts = Repost.objects.filter(article=article).count()
    if user and current_reaction is None:
        current_reaction = Reaction.objects.filter(user=user, article=article).values_list("reaction_type", flat=True).first()
    serializer = ReactionSummarySerializer(
        {
            "likes": likes,
            "dislikes": dislikes,
            "comments": comments,
            "reposts": reposts,
            "user_reaction": current_reaction,
        }
    )
    return serializer.data


def _broadcast_reaction(article_id, summary):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        f"reactions_{article_id}",
        {"type": "reaction.update", "data": dict(summary)},
    )
