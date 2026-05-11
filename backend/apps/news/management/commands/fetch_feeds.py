from django.core.management.base import BaseCommand

from apps.news.services import fetch_all_feeds
from apps.news.services_external import fetch_gnews_canada, fetch_newsapi_canada


class Command(BaseCommand):
    help = "Fetch configured RSS feeds and optional external API news into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--include-external",
            action="store_true",
            help="Also ingest NewsAPI and GNews content when API keys are configured.",
        )

    def handle(self, *args, **options):
        summary = fetch_all_feeds()
        if options["include_external"]:
            summary.extend(fetch_newsapi_canada())
            summary.extend(fetch_gnews_canada())

        for item in summary:
            self.stdout.write(str(item))
