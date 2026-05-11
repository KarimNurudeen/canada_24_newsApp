from django.conf import settings
from django.db import models


class AlertPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alert_preferences")
    breaking_news = models.BooleanField(default=True)
    top_stories = models.BooleanField(default=True)
    local_news = models.BooleanField(default=True)
    health = models.BooleanField(default=False)
    sports = models.BooleanField(default=False)
    business = models.BooleanField(default=False)
    entertainment = models.BooleanField(default=False)
    politics = models.BooleanField(default=False)
    science = models.BooleanField(default=False)
    environment = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "alert_preferences"

    def __str__(self):
        return f"Alerts<{self.user.email}>"


class PushToken(models.Model):
    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_tokens")
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=16, choices=Platform.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "push_tokens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} [{self.platform}]"
