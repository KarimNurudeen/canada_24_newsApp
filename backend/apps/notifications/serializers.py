from rest_framework import serializers

from .models import AlertPreference, PushToken


class AlertPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertPreference
        fields = [
            "breaking_news",
            "top_stories",
            "local_news",
            "health",
            "sports",
            "business",
            "entertainment",
            "politics",
            "science",
            "environment",
        ]


class PushTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushToken
        fields = ["token", "platform"]


class PushTokenDeleteSerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True)
