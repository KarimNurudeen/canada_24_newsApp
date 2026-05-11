from django.core.management.base import BaseCommand

from apps.regions.constants import REGION_SEEDS
from apps.regions.models import Region


class Command(BaseCommand):
    help = "Seed the default Canadian regions used by the app."

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for region in REGION_SEEDS:
            _, was_created = Region.objects.update_or_create(slug=region["slug"], defaults=region)
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded regions: {created} created, {updated} updated."))
