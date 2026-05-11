from rest_framework import serializers

from .models import User


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP code must be a 6-digit number.")
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "avatar",
            "bio",
            "is_verified",
            "joined_at",
        ]
        read_only_fields = ["id", "email", "is_verified", "joined_at"]


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["display_name", "avatar", "bio"]

    def validate_display_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Display name cannot be blank.")
        return value


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
