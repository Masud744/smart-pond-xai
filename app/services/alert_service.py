import logging
from app.config import settings

logger = logging.getLogger(__name__)

# শেষ কোন status এ alert পাঠানো হয়েছে track করি
last_alerted_status = "GOOD"


def send_email_alert(subject: str, message: str):
    """Email এ alert পাঠায়"""
    if not settings.EMAIL_ENABLED:
        logger.info(f"[ALERT] Email disabled. Message: {subject}")
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg["From"]    = settings.EMAIL_FROM
        msg["To"]      = settings.EMAIL_TO
        msg["Subject"] = subject
        msg.attach(MIMEText(message, "plain"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.send_message(msg)

        logger.info("Email alert sent ✓")
        return True

    except Exception as e:
        logger.error(f"Email error: {e}")
        return False


def check_and_alert(status: str, temp: float, ph: float, turbidity: int):
    """Status খারাপ হলে email alert পাঠায়"""
    global last_alerted_status

    # একই status এ আগে alert গেলে আবার পাঠাবো না
    if status == last_alerted_status:
        return

    if status == "POOR":
        subject = "🚨 POND ALERT — WATER QUALITY POOR!"
        message = (
            f"POND ALERT — WATER QUALITY POOR\n"
            f"{'='*40}\n"
            f"Temperature : {temp:.1f}°C\n"
            f"pH          : {ph:.2f}\n"
            f"Turbidity   : {turbidity}%\n\n"
            f"⚠️  Fish feeding stopped automatically!\n"
            f"🧹 Manual cleaning required!"
        )
        send_email_alert(subject, message)

    elif status == "MODERATE":
        subject = "⚠️ POND WARNING — WATER QUALITY MODERATE"
        message = (
            f"POND WARNING — WATER QUALITY MODERATE\n"
            f"{'='*40}\n"
            f"Temperature : {temp:.1f}°C\n"
            f"pH          : {ph:.2f}\n"
            f"Turbidity   : {turbidity}%\n\n"
            f"👁️  Please monitor the pond closely."
        )
        send_email_alert(subject, message)

    elif status == "GOOD" and last_alerted_status in ["POOR", "MODERATE"]:
        subject = "✅ POND RECOVERED — WATER QUALITY GOOD"
        message = (
            f"POND RECOVERED — WATER QUALITY GOOD\n"
            f"{'='*40}\n"
            f"Temperature : {temp:.1f}°C\n"
            f"pH          : {ph:.2f}\n"
            f"Turbidity   : {turbidity}%\n\n"
            f"🐟 Fish feeding resumed!"
        )
        send_email_alert(subject, message)

    last_alerted_status = status