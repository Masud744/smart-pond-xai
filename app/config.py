from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    # ── InfluxDB ──
    INFLUXDB_URL    = os.getenv("INFLUXDB_URL",    "https://us-east-1-1.aws.cloud2.influxdata.com")
    INFLUXDB_TOKEN  = os.getenv("INFLUXDB_TOKEN",  "")
    INFLUXDB_ORG    = os.getenv("INFLUXDB_ORG",    "Team_Plan_B")
    INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "smart_pond_db")

    # ── Open-Meteo (Free, No API Key needed) ──
    WEATHER_LATITUDE  = float(os.getenv("WEATHER_LATITUDE",  "24.07"))
    WEATHER_LONGITUDE = float(os.getenv("WEATHER_LONGITUDE", "90.22"))
    WEATHER_INTERVAL  = int(os.getenv("WEATHER_INTERVAL",    "15"))    # minutes

    # ── Email Alerts ──
    EMAIL_ENABLED  = os.getenv("EMAIL_ENABLED",  "false").lower() == "true"
    EMAIL_HOST     = os.getenv("EMAIL_HOST",     "smtp.gmail.com")
    EMAIL_PORT     = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USER     = os.getenv("EMAIL_USER",     "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_FROM     = os.getenv("EMAIL_FROM",     "")
    EMAIL_TO       = os.getenv("EMAIL_TO",       "")

    # ── Pond Config ──
    POND_ID   = os.getenv("POND_ID",   "pond_01")
    DEVICE_ID = os.getenv("DEVICE_ID", "esp32_01")

    # ── Water Quality Thresholds ──
    PH_GOOD_MIN   = 6.5
    PH_GOOD_MAX   = 8.5
    PH_MOD_MIN    = 6.0
    PH_MOD_MAX    = 9.0
    TEMP_GOOD_MIN = 20.0
    TEMP_GOOD_MAX = 32.0
    TURB_GOOD_MAX = 30
    TURB_MOD_MAX  = 60

    # ── Auto Feeding ──
    FEED_INTERVAL_HOURS = int(os.getenv("FEED_INTERVAL_HOURS", "9"))
    FEED_DURATION_SEC   = int(os.getenv("FEED_DURATION_SEC",   "5"))

settings = Settings()