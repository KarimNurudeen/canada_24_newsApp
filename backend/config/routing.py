from django.urls import re_path

from apps.interactions.consumers import ReactionsConsumer
from apps.news.consumers import NewsFeedConsumer

websocket_urlpatterns = [
    re_path(r"^ws/news/$", NewsFeedConsumer.as_asgi()),
    re_path(r"^ws/reactions/(?P<article_id>\d+)/$", ReactionsConsumer.as_asgi()),
]
