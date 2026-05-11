from django.conf import settings
from django.core.mail import send_mail


def send_otp_email(email, code):
    subject = "Your Canada In Real Time verification code"
    message = (
        f"Your Canada In Real Time verification code is {code}.\n\n"
        f"It expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
        "If you did not request this code, you can safely ignore this email."
    )
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9f9f9; padding: 32px;">
      <div style="background: #1976D2; padding: 20px 24px; margin-bottom: 24px;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: 900;">CANADA IN REAL TIME</h1>
      </div>
      <p style="font-size: 15px; color: #333; margin-bottom: 8px;">Use this one-time verification code to sign in:</p>
      <div style="background: #fff; border: 2px solid #1976D2; padding: 24px; text-align: center; margin: 16px 0;">
        <p style="font-size: 42px; letter-spacing: 12px; font-weight: 900; color: #111; margin: 0;">{code}</p>
      </div>
      <p style="font-size: 13px; color: #666;">This code expires in <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <p style="font-size: 12px; color: #999; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
        If you did not request this code, no action is required. Do not share this code with anyone.
      </p>
    </div>
    """
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )
