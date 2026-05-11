from django.urls import path

from .views import MyRegionsView, RegionListView

urlpatterns = [
    path("", RegionListView.as_view(), name="region-list"),
    path("me/", MyRegionsView.as_view(), name="my-regions"),
]
