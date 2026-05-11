from django.db.models import BooleanField, CharField, Count, Exists, OuterRef, Q, Subquery, Value


def annotate_article_queryset(queryset, user=None):
    from apps.interactions.models import Reaction, Repost, SavedArticle

    queryset = queryset.annotate(
        likes_count=Count(
            "reactions",
            filter=Q(reactions__reaction_type=Reaction.ReactionType.LIKE),
            distinct=True,
        ),
        dislikes_count=Count(
            "reactions",
            filter=Q(reactions__reaction_type=Reaction.ReactionType.DISLIKE),
            distinct=True,
        ),
        comments_count=Count("comments", distinct=True),
        reposts_count=Count("reposts", distinct=True),
        saves_count=Count("saved_by", distinct=True),
    )

    if user and user.is_authenticated:
        user_reaction = Reaction.objects.filter(
            user=user,
            article=OuterRef("pk"),
        ).values("reaction_type")[:1]
        queryset = queryset.annotate(
            user_reaction=Subquery(user_reaction, output_field=CharField()),
            is_saved=Exists(SavedArticle.objects.filter(user=user, article=OuterRef("pk"))),
            is_reposted=Exists(Repost.objects.filter(user=user, article=OuterRef("pk"))),
        )
    else:
        queryset = queryset.annotate(
            user_reaction=Value(None, output_field=CharField()),
            is_saved=Value(False, output_field=BooleanField()),
            is_reposted=Value(False, output_field=BooleanField()),
        )

    return queryset
