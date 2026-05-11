from django.conf import settings
from django.db import models


class Region(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    province = models.CharField(max_length=120)
    rss_url = models.URLField(blank=True)

    class Meta:
        db_table = "regions"
        ordering = ["id"]

    def __str__(self):
        return self.name


class UserRegion(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_regions")
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="user_regions")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_regions"
        constraints = [
            models.UniqueConstraint(fields=["user", "region"], name="unique_user_region"),
        ]
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.email} -> {self.region.slug}"
