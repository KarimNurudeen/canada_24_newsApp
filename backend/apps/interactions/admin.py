from django.contrib import admin

from .models import Comment, Reaction, Repost, SavedArticle


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "reaction_type", "updated_at")
    list_filter = ("reaction_type",)
    search_fields = ("user__email", "article__headline")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "created_at")
    search_fields = ("user__email", "article__headline", "text")


@admin.register(Repost)
class RepostAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "created_at")
    search_fields = ("user__email", "article__headline")


@admin.register(SavedArticle)
class SavedArticleAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "saved_at")
    search_fields = ("user__email", "article__headline")
