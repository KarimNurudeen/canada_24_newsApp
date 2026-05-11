from rest_framework import serializers

from .models import Region


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["id", "slug", "name", "province", "rss_url"]


class UserRegionUpdateSerializer(serializers.Serializer):
    regions = serializers.ListField(
        child=serializers.SlugField(),
        allow_empty=True,
    )

    def validate_regions(self, value):
        existing = set(Region.objects.filter(slug__in=value).values_list("slug", flat=True))
        missing = sorted(set(value) - existing)
        if missing:
            raise serializers.ValidationError(f"Unknown region(s): {', '.join(missing)}")
        return value
