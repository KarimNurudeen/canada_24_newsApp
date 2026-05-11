import re
from datetime import datetime, timezone as dt_timezone
from email.utils import parsedate_to_datetime
from html import unescape
from typing import Optional
from xml.etree import ElementTree as ET

import requests
from django.utils import timezone

from apps.regions.models import Region

from .constants import CATEGORY_LABEL_TO_CODE, RSS_FEEDS
from .models import Article, canonical_category

IMG_TAG_RE = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
USER_AGENT = "Canada247Bot/1.0 (+https://canada247.local)"
MEDIA_NAMESPACE = "{http://search.yahoo.com/mrss/}"
DC_NAMESPACE = "{http://purl.org/dc/elements/1.1/}"
CONTENT_NAMESPACE = "{http://purl.org/rss/1.0/modules/content/}"
ATOM_NAMESPACE = "{http://www.w3.org/2005/Atom}"


def text_or_blank(element):
    return (element.text or "").strip() if element is not None else ""


def strip_html(value):
    value = unescape(value or "")
    value = TAG_RE.sub(" ", value)
    return re.sub(r"\s+", " ", value).strip()


def extract_image_url(item, raw_description):
    for tag_name in (f"{MEDIA_NAMESPACE}content", f"{MEDIA_NAMESPACE}thumbnail"):
        media = item.find(tag_name)
        if media is not None and media.attrib.get("url"):
            return media.attrib["url"].strip()

    enclosure = item.find("enclosure")
    if enclosure is not None and enclosure.attrib.get("url"):
        return enclosure.attrib["url"].strip()

    match = IMG_TAG_RE.search(raw_description or "")
    return match.group(1).strip() if match else ""


def parse_published_at(value):
    if not value:
        return timezone.now()
    try:
        parsed = parsedate_to_datetime(value)
        if parsed is None:
            raise ValueError("Unable to parse datetime")
        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
        return parsed
    except Exception:
        return timezone.now()


def normalize_category(default_category, item):
    if default_category:
        return canonical_category(default_category)

    category_text = text_or_blank(item.find("category")).lower()
    raw = CATEGORY_LABEL_TO_CODE.get(category_text, Article.Category.GENERAL)
    return canonical_category(raw)


def parse_atom_date(value: str):
    """Parse ISO 8601 date used in Atom feeds."""
    if not value:
        return timezone.now()
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt_timezone.utc)
        return parsed
    except Exception:
        return timezone.now()


def _atom_link(item) -> str:
    """Extract href from Atom <link rel='alternate' href='...'> or <link href='...'>."""
    for link_el in item.findall(f"{ATOM_NAMESPACE}link"):
        rel = link_el.attrib.get("rel", "alternate")
        href = link_el.attrib.get("href", "")
        if rel in ("alternate", "") and href:
            return href
    # fallback: non-namespaced link element inside Atom entry
    link_el = item.find("link")
    if link_el is not None:
        return link_el.attrib.get("href", "") or (link_el.text or "").strip()
    return ""


def _build_entry(item, feed_key, default_category, *, is_atom=False) -> dict | None:
    if is_atom:
        title = text_or_blank(item.find(f"{ATOM_NAMESPACE}title"))
        raw_description = (
            text_or_blank(item.find(f"{ATOM_NAMESPACE}content"))
            or text_or_blank(item.find(f"{ATOM_NAMESPACE}summary"))
        )
        link = _atom_link(item)
        guid = text_or_blank(item.find(f"{ATOM_NAMESPACE}id")) or link
        author_el = item.find(f"{ATOM_NAMESPACE}author")
        author = text_or_blank(author_el.find(f"{ATOM_NAMESPACE}name")) if author_el is not None else ""
        date_str = (
            text_or_blank(item.find(f"{ATOM_NAMESPACE}published"))
            or text_or_blank(item.find(f"{ATOM_NAMESPACE}updated"))
        )
        published_at = parse_atom_date(date_str)
    else:
        title = text_or_blank(item.find("title"))
        raw_description = text_or_blank(item.find("description")) or text_or_blank(item.find(f"{CONTENT_NAMESPACE}encoded"))
        link = text_or_blank(item.find("link"))
        guid = text_or_blank(item.find("guid")) or link
        author = text_or_blank(item.find("author")) or text_or_blank(item.find(f"{DC_NAMESPACE}creator"))
        published_at = parse_published_at(text_or_blank(item.find("pubDate")))

    if not title:
        return None

    if not guid:
        guid = f"{feed_key}:{title}"

    body = strip_html(raw_description)
    category = normalize_category(default_category, item)
    img_url = extract_image_url(item, raw_description)
    title_lower = title.lower()
    body_lower = body.lower()

    return {
        "external_id": guid[:255],
        "headline": title,
        "body": body,
        "category": category,
        "img_url": img_url,
        "source_url": link,
        "author": author,
        "published_at": published_at,
        "is_live": "live" in title_lower or "live" in body_lower,
        "is_updated": "updated" in title_lower or "updated" in body_lower,
        "source": Article.Source.RSS,
        "feed_key": feed_key,
    }


def parse_feed(xml_text, feed_key, default_category=None):
    root = ET.fromstring(xml_text)

    # Detect format: RSS 2.0 uses <item>, Atom uses <entry>
    rss_items = root.findall(".//item")
    atom_items = root.findall(f".//{ATOM_NAMESPACE}entry")

    if rss_items:
        raw_items = [(item, False) for item in rss_items]
    else:
        raw_items = [(item, True) for item in atom_items]

    entries = []
    for item, is_atom in raw_items:
        entry = _build_entry(item, feed_key, default_category, is_atom=is_atom)
        if entry:
            entries.append(entry)
    return entries


def upsert_feed(url, feed_key, default_category=None, region: Optional[Region] = None):
    response = requests.get(
        url,
        timeout=15,
        headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.8"},
    )
    response.raise_for_status()
    entries = parse_feed(response.text, feed_key=feed_key, default_category=default_category)

    created_count = 0
    updated_count = 0
    created_ids = []

    for entry in entries:
        defaults = entry.copy()
        article, created = Article.objects.get_or_create(external_id=entry["external_id"], defaults=defaults)
        update_fields = []
        if not created:
            for field, value in entry.items():
                if getattr(article, field) != value:
                    setattr(article, field, value)
                    update_fields.append(field)
            if update_fields:
                article.is_updated = True
                if "is_updated" not in update_fields:
                    update_fields.append("is_updated")
                article.save(update_fields=update_fields)
                updated_count += 1
        else:
            created_count += 1
            created_ids.append(article.pk)

        if region is not None:
            article.regions.add(region)

    return {"feed_key": feed_key, "created": created_count, "updated": updated_count, "total": len(entries), "created_ids": created_ids}


def fetch_all_feeds():
    summary = []

    for feed in RSS_FEEDS:
        try:
            summary.append(
                upsert_feed(
                    url=feed["url"],
                    feed_key=feed["feed_key"],
                    default_category=feed["category"],
                )
            )
        except Exception as exc:
            summary.append({"feed_key": feed["feed_key"], "error": str(exc)})

    for region in Region.objects.exclude(rss_url=""):
        try:
            summary.append(
                upsert_feed(
                    url=region.rss_url,
                    feed_key=region.slug,
                    default_category=Article.Category.GENERAL,
                    region=region,
                )
            )
        except Exception as exc:
            summary.append({"feed_key": region.slug, "error": str(exc)})

    return summary
