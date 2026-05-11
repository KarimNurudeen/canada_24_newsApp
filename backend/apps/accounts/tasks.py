from config.celery_compat import shared_task
from django.utils import timezone

from .models import OTPVerification


@shared_task
def cleanup_expired_otps():
    deleted, _ = OTPVerification.objects.filter(expires_at__lt=timezone.now()).delete()
    return deleted
