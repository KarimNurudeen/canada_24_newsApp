from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import OTPVerification, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "display_name", "is_verified", "is_staff", "joined_at")
    list_filter = ("is_verified", "is_staff", "is_active")
    search_fields = ("email", "display_name")
    ordering = ("-joined_at",)
    readonly_fields = ("joined_at", "last_login")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("display_name", "avatar", "bio")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_verified",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("joined_at", "last_login")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "display_name", "password1", "password2"),
            },
        ),
    )


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ("email", "is_used", "attempts", "expires_at", "created_at")
    list_filter = ("is_used",)
    search_fields = ("email",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
