from django.db import migrations


REGION_SEEDS = [
    {"slug": "calgary", "name": "Calgary", "province": "Alberta", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-calgary"},
    {"slug": "edmonton", "name": "Edmonton", "province": "Alberta", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-edmonton"},
    {"slug": "winnipeg", "name": "Winnipeg", "province": "Manitoba", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-manitoba"},
    {"slug": "kitchener-waterloo", "name": "Kitchener-Waterloo", "province": "Ontario", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-kitchenerwaterloo"},
    {"slug": "toronto", "name": "Toronto", "province": "Ontario", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-toronto"},
    {"slug": "vancouver", "name": "Vancouver", "province": "British Columbia", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia"},
    {"slug": "montreal", "name": "Montreal", "province": "Quebec", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-montreal"},
    {"slug": "ottawa", "name": "Ottawa", "province": "Ontario", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-ottawa"},
    {"slug": "halifax", "name": "Halifax", "province": "Nova Scotia", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-novascotia"},
    {"slug": "regina", "name": "Regina", "province": "Saskatchewan", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-saskatchewan"},
    {"slug": "saskatoon", "name": "Saskatoon", "province": "Saskatchewan", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-saskatchewan"},
    {"slug": "victoria", "name": "Victoria", "province": "British Columbia", "rss_url": "https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia"},
]


def seed_regions(apps, schema_editor):
    Region = apps.get_model("regions", "Region")
    for region in REGION_SEEDS:
        Region.objects.update_or_create(slug=region["slug"], defaults=region)


def unseed_regions(apps, schema_editor):
    Region = apps.get_model("regions", "Region")
    Region.objects.filter(slug__in=[region["slug"] for region in REGION_SEEDS]).delete()


class Migration(migrations.Migration):
    dependencies = [("regions", "0001_initial")]

    operations = [migrations.RunPython(seed_regions, unseed_regions)]
