import requests
import logging
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger(__name__)

# Cache — ১৫ মিনিট পর পর fetch করবে
_weather_cache = None
_cache_time    = None
CACHE_MINUTES  = settings.WEATHER_INTERVAL


def get_weather() -> dict | None:
    """Open-Meteo থেকে current weather আনে (Free, No API Key)"""
    global _weather_cache, _cache_time

    now = datetime.now(timezone.utc)

    # Cache valid থাকলে সেটাই return করো
    if _weather_cache and _cache_time:
        diff = (now - _cache_time).total_seconds() / 60
        if diff < CACHE_MINUTES:
            return _weather_cache

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={settings.WEATHER_LATITUDE}"
            f"&longitude={settings.WEATHER_LONGITUDE}"
            f"&current=temperature_2m,relative_humidity_2m,"
            f"precipitation,wind_speed_10m,surface_pressure"
            f"&timezone=Asia/Dhaka"
        )

        response = requests.get(url, timeout=10)
        data     = response.json()

        if response.status_code != 200 or "current" not in data:
            logger.warning(f"Open-Meteo error: {data}")
            return _weather_cache  # পুরনো cache return করো

        current = data["current"]

        weather = {
            "air_temperature" : current.get("temperature_2m",        0.0),
            "humidity"        : current.get("relative_humidity_2m",  0.0),
            "rainfall"        : current.get("precipitation",          0.0),
            "wind_speed"      : current.get("wind_speed_10m",         0.0),
            "pressure"        : current.get("surface_pressure",       0.0),
        }

        _weather_cache = weather
        _cache_time    = now

        logger.info(f"Weather fetched ✓ Temp:{weather['air_temperature']}°C")
        return weather

    except Exception as e:
        logger.error(f"Weather fetch error: {e}")
        return _weather_cache  # error হলে পুরনো cache return করো