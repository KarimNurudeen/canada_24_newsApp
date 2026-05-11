from django.contrib import admin

from .models import Region, UserRegion


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("name", "province", "slug", "rss_url")
    search_fields = ("name", "province", "slug")


@admin.register(UserRegion)
class UserRegionAdmin(admin.ModelAdmin):
    list_display = ("user", "region", "created_at")
    search_fields = ("user__email", "region__name", "region__slug")
