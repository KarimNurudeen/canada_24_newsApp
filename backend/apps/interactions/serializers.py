from rest_framework import serializers

from apps.news.serializers import ArticleSerializer

from .models import Comment, Reaction, SavedArticle


class ReactionToggleSerializer(serializers.Serializer):
    reaction_type = serializers.ChoiceField(choices=Reaction.ReactionType.choices)


class ReactionSummarySerializer(serializers.Serializer):
    likes = serializers.IntegerField()
    dislikes = serializers.IntegerField()
    comments = serializers.IntegerField()
    reposts = serializers.IntegerField()
    user_reaction = serializers.CharField(allow_null=True)


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="user.display_name", read_only=True)
    author_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "article", "text", "created_at", "author_name", "author_email"]
        read_only_fields = ["id", "article", "created_at", "author_name", "author_email"]

    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment text cannot be blank.")
        return value


class SavedArticleSerializer(serializers.ModelSerializer):
    article = ArticleSerializer(read_only=True)

    class Meta:
        model = SavedArticle
        fields = ["id", "saved_at", "article"]
