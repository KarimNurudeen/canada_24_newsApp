import ssl
import certifi
from django.core.mail.backends.smtp import EmailBackend


class CertifiSMTPBackend(EmailBackend):
    """
    SMTP backend that uses certifi's CA bundle.
    Fixes SSL certificate verification on macOS where the system CA store
    is not automatically available to Python.
    """

    def open(self):
        if self.connection:
            return False
        self.ssl_context = ssl.create_default_context(cafile=certifi.where())
        return super().open()
