"""
External API integrations for Canadian content beyond RSS.

Supported sources:
  - NewsAPI.org  (set NEWS_API_KEY in .env to enable)
  - GNews.io     (set GNEWS_API_KEY in .env to enable)

Strategy:
  - Use /top-headlines for categories natively supported by each API.
  - Use keyword search (/everything or /search) for the 10 Canada-specific
    categories that have no native API equivalent: IMMIGRATION, AVIATION,
    INDIGENOUS, EVENTS, AUTO_NEWS, BLACKS_IN_CANADA, EDUCATION,
    OPPORTUNITIES, POLITICS, WORLD.
"""

from datetime import datetime, timezone

import requests
from django.conf import settings

from .models import Article

USER_AGENT = "CanadaInRealTime/1.0"


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_iso(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(tz=timezone.utc)


def _upsert_entries(entries: list[dict]) -> dict:
    created_count = 0
    updated_count = 0
    created_ids = []

    for entry in entries:
        article, created = Article.objects.get_or_create(
            external_id=entry["external_id"],
            defaults=entry,
        )
        if created:
            created_count += 1
            created_ids.append(article.pk)
        else:
            update_fields = []
            for field, value in entry.items():
                if getattr(article, field) != value:
                    setattr(article, field, value)
                    update_fields.append(field)
            if update_fields:
                article.is_updated = True
                update_fields.append("is_updated")
                article.save(update_fields=update_fields)
                updated_count += 1

    return {"created": created_count, "updated": updated_count, "total": len(entries), "created_ids": created_ids}


def _build_entry(external_id: str, title: str, body: str, category,
                 img_url: str, source_url: str, author: str,
                 published_at: datetime, feed_key: str) -> dict:
    return {
        "external_id": external_id[:255],
        "headline": title[:500],
        "body": body[:5000],
        "category": category,
        "img_url": img_url,
        "source_url": source_url,
        "author": author[:255],
        "published_at": published_at,
        "is_live": False,
        "is_updated": False,
        "source": Article.Source.RSS,
        "feed_key": feed_key,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NewsAPI.org
# ─────────────────────────────────────────────────────────────────────────────

NEWSAPI_BASE = "https://newsapi.org/v2"

# Categories natively supported by NewsAPI top-headlines with country=ca
NEWSAPI_HEADLINE_CATEGORIES = [
    ("business",      Article.Category.BUSINESS),
    ("health",        Article.Category.HEALTH),
    ("technology",    Article.Category.TECHNOLOGY),
    ("sports",        Article.Category.SPORTS),
    ("entertainment", Article.Category.ENTERTAINMENT),
    ("general",       Article.Category.GENERAL),
]

# Categories fetched via /everything with targeted Canadian keyword queries
NEWSAPI_KEYWORD_SEARCHES = [
    ("politics",     Article.Category.POLITICS,
     '"canada politics" OR "parliament canada" OR "federal government canada" OR "trudeau" OR "NDP canada" OR "conservative canada"'),

    ("immigration",  Article.Category.IMMIGRATION,
     '"canada immigration" OR "IRCC" OR "newcomers canada" OR "permanent resident canada" OR "canada visa" OR "express entry"'),

    ("aviation",     Article.Category.AVIATION,
     '"Air Canada" OR "WestJet" OR "canada aviation" OR "Toronto Pearson" OR "canada airline" OR "Flair Airlines"'),

    ("indigenous",   Article.Category.INDIGENOUS,
     '"First Nations" OR "Métis" OR "Inuit" OR "indigenous canada" OR "treaty rights canada" OR "reconciliation canada"'),

    ("events",       Article.Category.EVENTS,
     '"canada festival" OR "events canada 2025" OR "concert canada" OR "canada celebration" OR "canada day" OR "toronto events"'),

    ("auto-news",    Article.Category.AUTO_NEWS,
     '"canada automotive" OR "electric vehicle canada" OR "car news canada" OR "GM canada" OR "Toyota canada" OR "EV canada"'),

    ("blacks-in-canada", Article.Category.BLACKS_IN_CANADA,
     '"black canadians" OR "black community canada" OR "african canadian" OR "afro-canadian" OR "anti-black racism canada"'),

    ("education",    Article.Category.EDUCATION,
     '"canada education" OR "university canada" OR "canadian schools" OR "tuition canada" OR "student canada" OR "colleges canada"'),

    ("opportunities", Article.Category.OPPORTUNITIES,
     '"canada jobs" OR "canada careers" OR "job market canada" OR "employment canada" OR "scholarship canada" OR "grant canada"'),

    ("world",        Article.Category.WORLD,
     '"canada foreign policy" OR "canada international" OR "canada united nations" OR "canada nato" OR "canada trade" OR "canada diplomacy"'),
]


def _map_newsapi_item(item: dict, category, feed_key: str) -> dict | None:
    title = (item.get("title") or "").strip()
    url = (item.get("url") or "").strip()
    if not title or not url or title == "[Removed]":
        return None
    return _build_entry(
        external_id=f"newsapi:{url}",
        title=title,
        body=(item.get("content") or item.get("description") or "").strip(),
        category=category,
        img_url=(item.get("urlToImage") or "").strip(),
        source_url=url,
        author=(item.get("author") or item.get("source", {}).get("name") or "").strip(),
        published_at=_parse_iso(item.get("publishedAt") or ""),
        feed_key=feed_key,
    )


def fetch_newsapi_canada() -> list[dict]:
    """Fetch Canadian news from NewsAPI for all 15 categories."""
    api_key = getattr(settings, "NEWS_API_KEY", "")
    if not api_key:
        return [{"feed_key": "newsapi", "skipped": True, "detail": "NEWS_API_KEY not configured"}]

    summary = []

    # ── Top-headlines for natively supported categories ───────────────────────
    for cat_key, category in NEWSAPI_HEADLINE_CATEGORIES:
        feed_key = f"newsapi-headlines-{cat_key}"
        try:
            resp = requests.get(
                f"{NEWSAPI_BASE}/top-headlines",
                params={
                    "country": "ca",
                    "category": cat_key,
                    "pageSize": 100,
                    "apiKey": api_key,
                },
                timeout=15,
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            entries = [
                e for item in resp.json().get("articles", [])
                if (e := _map_newsapi_item(item, category, feed_key)) is not None
            ]
            result = _upsert_entries(entries)
            result["feed_key"] = feed_key
            summary.append(result)
        except Exception as exc:
            summary.append({"feed_key": feed_key, "error": str(exc)})

    # ── Keyword /everything search for Canada-specific categories ─────────────
    for cat_key, category, query in NEWSAPI_KEYWORD_SEARCHES:
        feed_key = f"newsapi-search-{cat_key}"
        try:
            resp = requests.get(
                f"{NEWSAPI_BASE}/everything",
                params={
                    "q": query,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 100,
                    "apiKey": api_key,
                },
                timeout=15,
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            entries = [
                e for item in resp.json().get("articles", [])
                if (e := _map_newsapi_item(item, category, feed_key)) is not None
            ]
            result = _upsert_entries(entries)
            result["feed_key"] = feed_key
            summary.append(result)
        except Exception as exc:
            summary.append({"feed_key": feed_key, "error": str(exc)})

    return summary


# ─────────────────────────────────────────────────────────────────────────────
# GNews.io
# ─────────────────────────────────────────────────────────────────────────────

GNEWS_BASE = "https://gnews.io/api/v4"

# Topics natively supported by GNews top-headlines
GNEWS_HEADLINE_TOPICS = [
    ("breaking-news", Article.Category.GENERAL),
    ("business",      Article.Category.BUSINESS),
    ("technology",    Article.Category.TECHNOLOGY),
    ("sports",        Article.Category.SPORTS),
    ("health",        Article.Category.HEALTH),
    ("entertainment", Article.Category.ENTERTAINMENT),
    ("world",         Article.Category.WORLD),
    ("nation",        Article.Category.POLITICS),
]

# Keyword searches for Canada-specific categories
GNEWS_KEYWORD_SEARCHES = [
    ("immigration",      Article.Category.IMMIGRATION,
     "canada immigration IRCC newcomers permanent resident"),

    ("aviation",         Article.Category.AVIATION,
     "Air Canada WestJet canada aviation airline"),

    ("indigenous",       Article.Category.INDIGENOUS,
     "First Nations Métis Inuit indigenous canada reconciliation"),

    ("events",           Article.Category.EVENTS,
     "canada festival events concert celebration 2025"),

    ("auto-news",        Article.Category.AUTO_NEWS,
     "canada automotive electric vehicle car news EV"),

    ("blacks-in-canada", Article.Category.BLACKS_IN_CANADA,
     "black canadians african canadian community"),

    ("education",        Article.Category.EDUCATION,
     "canada education university schools tuition student"),

    ("opportunities",    Article.Category.OPPORTUNITIES,
     "canada jobs careers employment scholarship grant"),

    ("politics",         Article.Category.POLITICS,
     "canada politics parliament federal government trudeau"),
]


def _map_gnews_item(item: dict, category, feed_key: str) -> dict | None:
    title = (item.get("title") or "").strip()
    url = (item.get("url") or "").strip()
    if not title or not url:
        return None
    return _build_entry(
        external_id=f"gnews:{url}",
        title=title,
        body=(item.get("content") or item.get("description") or "").strip(),
        category=category,
        img_url=(item.get("image") or "").strip(),
        source_url=url,
        author=(item.get("source", {}).get("name") or "").strip(),
        published_at=_parse_iso(item.get("publishedAt") or ""),
        feed_key=feed_key,
    )


def fetch_gnews_canada() -> list[dict]:
    """Fetch Canadian news from GNews for all 15 categories."""
    api_key = getattr(settings, "GNEWS_API_KEY", "")
    if not api_key:
        return [{"feed_key": "gnews", "skipped": True, "detail": "GNEWS_API_KEY not configured"}]

    summary = []

    # ── Top-headlines for natively supported topics ───────────────────────────
    for topic, category in GNEWS_HEADLINE_TOPICS:
        feed_key = f"gnews-headlines-{topic}"
        try:
            resp = requests.get(
                f"{GNEWS_BASE}/top-headlines",
                params={
                    "topic": topic,
                    "country": "ca",
                    "lang": "en",
                    "max": 10,
                    "apikey": api_key,
                },
                timeout=15,
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            entries = [
                e for item in resp.json().get("articles", [])
                if (e := _map_gnews_item(item, category, feed_key)) is not None
            ]
            result = _upsert_entries(entries)
            result["feed_key"] = feed_key
            summary.append(result)
        except Exception as exc:
            summary.append({"feed_key": feed_key, "error": str(exc)})

    # ── Keyword search for Canada-specific categories ─────────────────────────
    for cat_key, category, query in GNEWS_KEYWORD_SEARCHES:
        feed_key = f"gnews-search-{cat_key}"
        try:
            resp = requests.get(
                f"{GNEWS_BASE}/search",
                params={
                    "q": query,
                    "country": "ca",
                    "lang": "en",
                    "max": 10,
                    "sortby": "publishedAt",
                    "apikey": api_key,
                },
                timeout=15,
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            entries = [
                e for item in resp.json().get("articles", [])
                if (e := _map_gnews_item(item, category, feed_key)) is not None
            ]
            result = _upsert_entries(entries)
            result["feed_key"] = feed_key
            summary.append(result)
        except Exception as exc:
            summary.append({"feed_key": feed_key, "error": str(exc)})

    return summary
