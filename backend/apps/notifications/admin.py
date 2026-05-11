from django.contrib import admin

from .models import AlertPreference, PushToken


@admin.register(AlertPreference)
class AlertPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "breaking_news",
        "top_stories",
        "local_news",
        "business",
        "sports",
        "updated_at",
    )
    search_fields = ("user__email",)


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "created_at")
    search_fields = ("user__email", "token")
