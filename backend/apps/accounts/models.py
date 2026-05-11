import random
import string
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must have is_superuser=True")

        user = self.create_user(email=email, **extra_fields)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150, blank=True)
    avatar = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        ordering = ["-joined_at"]

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.display_name:
            local_part = self.email.split("@")[0]
            self.display_name = local_part.replace(".", " ").replace("_", " ").replace("-", " ").title()
        super().save(*args, **kwargs)


class OTPVerification(models.Model):
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "otp_verifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "is_used", "expires_at"]),
        ]

    def __str__(self):
        return f"OTP<{self.email}>"

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        super().save(*args, **kwargs)

    @property
    def max_attempts(self):
        return settings.OTP_MAX_ATTEMPTS

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def can_attempt(self):
        return not self.is_used and not self.is_expired() and self.attempts < self.max_attempts

    def set_code(self, raw_code):
        self.code = make_password(raw_code)

    def check_code(self, raw_code):
        return check_password(raw_code, self.code)

    @classmethod
    def generate_code(cls):
        return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))
