from django.db import migrations

REMAP = {
    "SCIENCE":      "TECHNOLOGY",
    "ENVIRONMENT":  "WORLD",
    "OPINION":      "POLITICS",
    "ARTS":         "ENTERTAINMENT",
    "MUSIC":        "ENTERTAINMENT",
    "JOBS_CAREERS": "OPPORTUNITIES",
    "SCHOLARSHIPS": "OPPORTUNITIES",
    "GRANTS":       "OPPORTUNITIES",
    "REAL_ESTATE":  "GENERAL",
    "TRAVEL":       "GENERAL",
    "FOOD":         "GENERAL",
    "GOVERNMENT":   "POLITICS",
}

VALID = {
    "GENERAL", "BUSINESS", "HEALTH", "ENTERTAINMENT", "TECHNOLOGY",
    "SPORTS", "IMMIGRATION", "AVIATION", "INDIGENOUS", "POLITICS",
    "EVENTS", "AUTO_NEWS", "BLACKS_IN_CANADA", "EDUCATION", "OPPORTUNITIES", "WORLD",
}


def remap_forward(apps, schema_editor):
    Article = apps.get_model("news", "Article")
    UserPost = apps.get_model("news", "UserPost")

    for old, new in REMAP.items():
        Article.objects.filter(category=old).update(category=new)
        UserPost.objects.filter(category=old).update(category=new)

    # Anything still not in the valid set → GENERAL
    Article.objects.exclude(category__in=VALID).update(category="GENERAL")
    UserPost.objects.exclude(category__in=VALID).update(category="GENERAL")


def remap_backward(apps, schema_editor):
    pass  # one-way migration


class Migration(migrations.Migration):

    dependencies = [
        ("news", "0002_alter_article_category_alter_userpost_category"),
    ]

    operations = [
        migrations.RunPython(remap_forward, remap_backward),
    ]
