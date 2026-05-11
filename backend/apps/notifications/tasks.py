import requests
from config.celery_compat import shared_task
from django.conf import settings

from apps.news.models import Article

from .models import PushToken


@shared_task
def send_push_notifications(article_id=None, title=None, body=None, preference_key="breaking_news"):
    if article_id is not None:
        article = Article.objects.filter(pk=article_id).first()
        if article is None:
            return {"sent": 0, "detail": "article not found"}
        title = title or article.headline
        body = body or (article.body[:160] if article.body else "A new story is available in Canada 24/7.")

    if not title:
        return {"sent": 0, "detail": "title is required"}

    tokens = PushToken.objects.filter(**{f"user__alert_preferences__{preference_key}": True}).values_list("token", flat=True)
    messages = [
        {
            "to": token,
            "title": title,
            "body": body or "A new story is available in Canada 24/7.",
            "sound": "default",
            "data": {"article_id": article_id, "preference_key": preference_key},
        }
        for token in tokens
    ]

    if not messages:
        return {"sent": 0, "detail": "no push tokens registered"}

    response = requests.post(
        settings.EXPO_PUSH_API_URL,
        json=messages,
        timeout=15,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
    )
    response.raise_for_status()
    return {"sent": len(messages), "response": response.json()}
