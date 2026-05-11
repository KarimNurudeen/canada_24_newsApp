from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AlertPreference, PushToken
from .serializers import AlertPreferenceSerializer, PushTokenDeleteSerializer, PushTokenSerializer


class AlertPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, user):
        preferences, _ = AlertPreference.objects.get_or_create(user=user)
        return preferences

    def get(self, request):
        serializer = AlertPreferenceSerializer(self.get_object(request.user))
        return Response(serializer.data)

    def put(self, request):
        preferences = self.get_object(request.user)
        serializer = AlertPreferenceSerializer(preferences, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        preferences = self.get_object(request.user)
        serializer = AlertPreferenceSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class PushTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PushTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        platform = serializer.validated_data["platform"]
        push_token, _ = PushToken.objects.update_or_create(
            token=token,
            defaults={"user": request.user, "platform": platform},
        )
        return Response(PushTokenSerializer(push_token).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        serializer = PushTokenDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data.get("token")
        queryset = PushToken.objects.filter(user=request.user)
        if token:
            queryset = queryset.filter(token=token)
        deleted, _ = queryset.delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)
