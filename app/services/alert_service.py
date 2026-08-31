import logging
from datetime import datetime, timezone
from app.config import settings
from app.services.influx_service import save_alert, get_latest_alert

logger = logging.getLogger(__name__)

# Reminder interval (in minutes) for continuous POOR or MODERATE status
REMINDER_COOLDOWN_MINUTES = 15

# Global in-memory cache to reduce InfluxDB lookups during rapid ingestion
_last_alert_cache = None


def send_email_alert(subject: str, message: str):
    """Email এ alert পাঠায়"""
    if not settings.EMAIL_ENABLED:
        logger.info(f"[ALERT] Email disabled. Subject: {subject}")
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


def _get_current_alert_state() -> dict:
    """
    Retrieves the last recorded alert state from cache or InfluxDB.
    Persists state across backend server restarts (e.g. Render restarts).
    """
    global _last_alert_cache
    if _last_alert_cache is not None:
        return _last_alert_cache

    # Query InfluxDB for the last recorded alert
    db_alert = get_latest_alert()
    if db_alert:
        severity = db_alert.get("severity", "RESOLVED")
        if severity == "CRITICAL":
            status = "POOR"
        elif severity == "WARNING":
            status = "MODERATE"
        else:
            status = "GOOD"

        ts = db_alert.get("timestamp")
        if isinstance(ts, str):
            try:
                from dateutil import parser
                ts = parser.parse(ts)
            except Exception:
                ts = None

        _last_alert_cache = {
            "status"    : status,
            "severity"  : severity,
            "timestamp" : ts
        }
        logger.info(f"Loaded alert state from InfluxDB → status:{status} ts:{ts}")
        return _last_alert_cache

    # Default fallback state
    _last_alert_cache = {
        "status"    : "GOOD",
        "severity"  : "RESOLVED",
        "timestamp" : None
    }
    return _last_alert_cache


def check_and_alert(status: str, temp: float, ph: float, turbidity: int, device_id: str = None):
    """
    Status অনুযায়ী Alert ও Reminder পরিচালনা করে:
    1. Status Transition (GOOD -> POOR / MODERATE): সাথে সাথে Alert ও Database entry.
    2. Continuous POOR/MODERATE: প্রতি ১৫ মিনিট পর পর Periodic Reminder Alert.
    3. Status Recovery (POOR/MODERATE -> GOOD): সাথে সাথে RESOLVED (INFO) Alert.
    """
    global _last_alert_cache

    current_state = _get_current_alert_state()
    last_status = current_state.get("status", "GOOD")
    last_ts = current_state.get("timestamp")

    now = datetime.now(timezone.utc)
    is_status_change = (status != last_status)

    # 15-minute cooldown calculation for continuous POOR/MODERATE status
    elapsed_minutes = 99999.0
    if last_ts:
        try:
            if last_ts.tzinfo is None:
                last_ts = last_ts.replace(tzinfo=timezone.utc)
            elapsed_minutes = (now - last_ts).total_seconds() / 60.0
        except Exception:
            elapsed_minutes = 99999.0

    should_send_reminder = (
        not is_status_change and
        status in ["POOR", "MODERATE"] and
        elapsed_minutes >= REMINDER_COOLDOWN_MINUTES
    )

    # If status hasn't changed AND 15 minutes haven't elapsed, suppress alert
    if not is_status_change and not should_send_reminder:
        return

    # Trigger alerts based on status
    if status == "POOR":
        severity = "CRITICAL"
        alert_type = "Water Quality Alert"

        if is_status_change:
            subject = "🚨 POND ALERT — WATER QUALITY POOR!"
            db_message = f"Water quality dropped to POOR. Temp: {temp:.1f}°C, pH: {ph:.2f}, Turbidity: {turbidity}%"
        else:
            subject = f"⏰ POND REMINDER (15m) — WATER QUALITY STILL POOR ({ph:.2f} pH)"
            db_message = f"Water quality STILL POOR (15m reminder). Temp: {temp:.1f}°C, pH: {ph:.2f}, Turbidity: {turbidity}%"

        email_message = (
            f"{subject}\n"
            f"{'='*45}\n"
            f"Temperature : {temp:.1f}°C\n"
            f"pH          : {ph:.2f}\n"
            f"Turbidity   : {turbidity}%\n\n"
            f"⚠️  Fish feeding stopped automatically!\n"
            f"🧹 Manual cleaning required!"
        )
        send_email_alert(subject, email_message)
        save_alert(alert_type=alert_type, severity=severity, message=db_message, device_id=device_id)

    elif status == "MODERATE":
        severity = "WARNING"
        alert_type = "Water Quality Warning"

        if is_status_change:
            subject = "⚠️ POND WARNING — WATER QUALITY MODERATE"
            db_message = f"Water quality dropped to MODERATE. Temp: {temp:.1f}°C, pH: {ph:.2f}, Turbidity: {turbidity}%"
        else:
            subject = f"⏰ POND REMINDER (15m) — WATER QUALITY STILL MODERATE ({ph:.2f} pH)"
            db_message = f"Water quality STILL MODERATE (15m reminder). Temp: {temp:.1f}°C, pH: {ph:.2f}, Turbidity: {turbidity}%"

        email_message = (
            f"{subject}\n"
            f"{'='*45}\n"
            f"Temperature : {temp:.1f}°C\n"
            f"pH          : {ph:.2f}\n"
            f"Turbidity   : {turbidity}%\n\n"
            f"👁️  Please monitor the pond closely."
        )
        send_email_alert(subject, email_message)
        save_alert(alert_type=alert_type, severity=severity, message=db_message, device_id=device_id)

    elif status == "GOOD" and last_status in ["POOR", "MODERATE"]:
        severity = "RESOLVED"
        alert_type = "Water Quality Recovery"

        subject = "✅ POND RECOVERED — WATER QUALITY GOOD"
        db_message = f"Water quality recovered to GOOD. Temp: {temp:.1f}°C, pH: {ph:.2f}, Turbidity: {turbidity}%"

        email_message = (
            f"{subject}\n"
            f"{'='*45}\n"
            f"Temperature : {temp:.1f}°C\n"
            f"pH          : {ph:.2f}\n"
            f"Turbidity   : {turbidity}%\n\n"
            f"🐟 Fish feeding resumed!"
        )
        send_email_alert(subject, email_message)
        save_alert(alert_type=alert_type, severity=severity, message=db_message, device_id=device_id)

    # Update cache with new state
    _last_alert_cache = {
        "status"   : status,
        "severity" : severity if status != "GOOD" else "RESOLVED",
        "timestamp": now
    }