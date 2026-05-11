from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Region, UserRegion
from .serializers import RegionSerializer, UserRegionUpdateSerializer


class RegionListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    pagination_class = None


class MyRegionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        regions = Region.objects.filter(user_regions__user=request.user).distinct().order_by("id")
        serializer = RegionSerializer(regions, many=True)
        return Response(
            {
                "regions": serializer.data,
                "slugs": [item["slug"] for item in serializer.data],
            }
        )

    def put(self, request):
        serializer = UserRegionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        slugs = serializer.validated_data["regions"]
        regions = list(Region.objects.filter(slug__in=slugs))

        with transaction.atomic():
            UserRegion.objects.filter(user=request.user).delete()
            UserRegion.objects.bulk_create(
                [UserRegion(user=request.user, region=region) for region in regions]
            )

        data = RegionSerializer(regions, many=True).data
        return Response({"regions": data, "slugs": [item["slug"] for item in data]}, status=status.HTTP_200_OK)
