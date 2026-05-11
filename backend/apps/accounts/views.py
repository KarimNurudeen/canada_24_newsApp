from django.conf import settings
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


class OTPThrottle(AnonRateThrottle):
    scope = "otp"

from apps.news.models import Article, UserPost
from apps.news.querysets import annotate_article_queryset
from apps.news.serializers import ArticleSerializer, UserPostSerializer
from apps.notifications.models import AlertPreference
from apps.notifications.serializers import AlertPreferenceSerializer
from apps.regions.models import Region
from apps.regions.serializers import RegionSerializer
from config.schema import extend_schema

from .models import OTPVerification, User
from .serializers import (
    LogoutSerializer,
    SendOTPSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from .utils import send_otp_email


@extend_schema(request=SendOTPSerializer)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([OTPThrottle])
def send_otp(request):
    serializer = SendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()

    OTPVerification.objects.filter(email=email, is_used=False).update(is_used=True)

    raw_code = OTPVerification.generate_code()
    otp = OTPVerification(email=email)
    otp.set_code(raw_code)
    otp.save()

    email_error = None
    try:
        send_otp_email(email=email, code=raw_code)
    except Exception as exc:
        email_error = str(exc)
        if not settings.DEBUG:
            return Response(
                {"detail": "Failed to send verification email. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    response_data = {"detail": "Verification code sent."}
    if settings.DEBUG:
        response_data["dev_code"] = raw_code
        if email_error:
            response_data["email_error"] = email_error
    return Response(response_data, status=status.HTTP_200_OK)


@extend_schema(request=VerifyOTPSerializer)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([OTPThrottle])
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()
    code = serializer.validated_data["code"]

    otp = OTPVerification.objects.filter(email=email, is_used=False).order_by("-created_at").first()
    if otp is None:
        return Response(
            {"detail": "No pending verification code was found for this email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if otp.is_expired():
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        return Response(
            {"detail": "This verification code has expired. Request a new code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if otp.attempts >= otp.max_attempts:
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        return Response(
            {"detail": "This verification code has reached the maximum number of attempts."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    otp.attempts += 1
    if not otp.check_code(code):
        update_fields = ["attempts"]
        remaining = max(otp.max_attempts - otp.attempts, 0)
        if otp.attempts >= otp.max_attempts:
            otp.is_used = True
            update_fields.append("is_used")
        otp.save(update_fields=update_fields)
        return Response(
            {"detail": f"Invalid code. {remaining} attempt(s) remaining."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        otp.is_used = True
        otp.save(update_fields=["attempts", "is_used"])
        user, is_new_user = User.objects.get_or_create(email=email)
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=["is_verified"])

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new_user": is_new_user,
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UpdateProfileSerializer
        return UserSerializer


class BootstrapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        alert_preferences, _ = AlertPreference.objects.get_or_create(user=request.user)
        regions = Region.objects.filter(user_regions__user=request.user).distinct().order_by("id")
        saved_articles = annotate_article_queryset(
            Article.objects.prefetch_related("regions")
            .filter(saved_by__user=request.user)
            .order_by("-saved_by__saved_at"),
            user=request.user,
        )
        my_posts = UserPost.objects.select_related("user").filter(user=request.user).order_by("-created_at")

        return Response(
            {
                "user": UserSerializer(request.user).data,
                "regions": RegionSerializer(regions, many=True).data,
                "region_slugs": list(regions.values_list("slug", flat=True)),
                "alerts": AlertPreferenceSerializer(alert_preferences).data,
                "saved_articles": ArticleSerializer(
                    saved_articles,
                    many=True,
                    context={"request": request},
                ).data,
                "my_posts": UserPostSerializer(my_posts, many=True).data,
            }
        )


@extend_schema(request=LogoutSerializer)
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    serializer = LogoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    token = RefreshToken(serializer.validated_data["refresh"])
    token.blacklist()
    return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
