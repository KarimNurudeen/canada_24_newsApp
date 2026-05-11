import importlib.util

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.static import serve
from django.http import JsonResponse
from django.urls import include, path, re_path


def health_check(request):
    return JsonResponse({"status": "ok", "app": "Canada In Real Time"})


def media_serve(request, path):
    return serve(request, path, document_root=settings.MEDIA_ROOT)


urlpatterns = [
    path("health/", health_check),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/news/", include("apps.news.urls")),
    path("api/v1/interactions/", include("apps.interactions.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/regions/", include("apps.regions.urls")),
    re_path(r"^media/(?P<path>.*)$", media_serve),
]

if importlib.util.find_spec("drf_spectacular") is not None:
    from drf_spectacular.views import (
        SpectacularAPIView,
        SpectacularRedocView,
        SpectacularSwaggerView,
    )

    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
        path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
