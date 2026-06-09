from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timezone
from app.config import settings
import logging
import json

logger = logging.getLogger(__name__)

# ── Client ──
client = InfluxDBClient(
    url   = settings.INFLUXDB_URL,
    token = settings.INFLUXDB_TOKEN,
    org   = settings.INFLUXDB_ORG
)

write_api = client.write_api(write_options=SYNCHRONOUS)
query_api  = client.query_api()


# ════════════════════════════════════════
# SENSOR DATA
# ════════════════════════════════════════

def save_sensor_data(temp: float, ph: float, turbidity: int, status: str) -> bool:
    """ESP32 থেকে আসা data InfluxDB তে save করে"""
    try:
        point = (
            Point("water_sensor_data")
            .tag("pond_id",   settings.POND_ID)
            .tag("device_id", settings.DEVICE_ID)
            .field("water_temperature", temp)
            .field("ph",                ph)
            .field("turbidity",         turbidity)
            .field("status",            status)
            .time(datetime.now(timezone.utc), WritePrecision.SECONDS)
        )
        write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        logger.info(f"Sensor saved → Temp:{temp} pH:{ph} Turb:{turbidity} Status:{status}")
        return True
    except Exception as e:
        logger.error(f"Sensor save error: {e}")
        return False


def get_latest_reading() -> dict | None:
    """সবচেয়ে সাম্প্রতিক sensor data আনে"""
    try:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -2h)
        |> filter(fn: (r) => r._measurement == "water_sensor_data")
        |> filter(fn: (r) => r.pond_id == "{settings.POND_ID}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        result = query_api.query(query, org=settings.INFLUXDB_ORG)
        if result and result[0].records:
            r = result[0].records[0]
            return {
                "temperature" : r.values.get("water_temperature", 0),
                "ph"          : r.values.get("ph", 0),
                "turbidity"   : int(r.values.get("turbidity", 0)),
                "status"      : r.values.get("status", "UNKNOWN"),
                "timestamp"   : str(r.get_time())
            }
        return None
    except Exception as e:
        logger.error(f"Sensor read error: {e}")
        return None


def get_history(hours: int = 24) -> list:
    """Last N ঘন্টার sensor history আনে"""
    try:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "water_sensor_data")
        |> filter(fn: (r) => r.pond_id == "{settings.POND_ID}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"])
        '''
        result  = query_api.query(query, org=settings.INFLUXDB_ORG)
        history = []
        if result:
            for r in result[0].records:
                history.append({
                    "time"        : str(r.get_time()),
                    "temperature" : r.values.get("water_temperature", 0),
                    "ph"          : r.values.get("ph", 0),
                    "turbidity"   : int(r.values.get("turbidity", 0)),
                    "status"      : r.values.get("status", "UNKNOWN")
                })
        return history
    except Exception as e:
        logger.error(f"History error: {e}")
        return []


# ════════════════════════════════════════
# WEATHER DATA
# ════════════════════════════════════════

def save_weather_data(weather: dict) -> bool:
    """Weather data InfluxDB তে save করে"""
    try:
        point = (
            Point("weather_data")
            .tag("pond_id", settings.POND_ID)
            .field("air_temperature", weather.get("air_temperature", 0.0))
            .field("humidity",        weather.get("humidity",        0.0))
            .field("rainfall",        weather.get("rainfall",        0.0))
            .field("wind_speed",      weather.get("wind_speed",      0.0))
            .field("pressure",        weather.get("pressure",        0.0))
            .time(datetime.now(timezone.utc), WritePrecision.SECONDS)
        )
        write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        logger.info("Weather saved ✓")
        return True
    except Exception as e:
        logger.error(f"Weather save error: {e}")
        return False


# ════════════════════════════════════════
# PREDICTIONS
# ════════════════════════════════════════

def save_prediction(water_quality: str, habitat_status: str,
                    quality_confidence: float, habitat_confidence: float,
                    model_version: str = "rf") -> bool:
    """ML prediction InfluxDB তে save করে"""
    try:
        # Water quality prediction
        p1 = (
            Point("water_quality_prediction")
            .tag("pond_id",       settings.POND_ID)
            .tag("model_version", model_version)
            .field("quality_class",    water_quality)
            .field("confidence_score", quality_confidence)
            .time(datetime.now(timezone.utc), WritePrecision.SECONDS)
        )
        # Fish habitat prediction
        p2 = (
            Point("fish_habitat_prediction")
            .tag("pond_id",       settings.POND_ID)
            .tag("model_version", model_version)
            .field("habitat_status",   habitat_status)
            .field("confidence_score", habitat_confidence)
            .time(datetime.now(timezone.utc), WritePrecision.SECONDS)
        )
        write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=[p1, p2])
        logger.info(f"Prediction saved → Quality:{water_quality} Habitat:{habitat_status}")
        return True
    except Exception as e:
        logger.error(f"Prediction save error: {e}")
        return False


def get_latest_prediction() -> dict | None:
    """Latest prediction আনে"""
    try:
        q1 = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "water_quality_prediction")
        |> filter(fn: (r) => r.pond_id == "{settings.POND_ID}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        q2 = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "fish_habitat_prediction")
        |> filter(fn: (r) => r.pond_id == "{settings.POND_ID}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        r1 = query_api.query(q1, org=settings.INFLUXDB_ORG)
        r2 = query_api.query(q2, org=settings.INFLUXDB_ORG)

        result = {}
        if r1 and r1[0].records:
            rec = r1[0].records[0]
            result["water_quality"]      = rec.values.get("quality_class", "UNKNOWN")
            result["quality_confidence"] = rec.values.get("confidence_score", 0)
            result["timestamp"]          = str(rec.get_time())
        if r2 and r2[0].records:
            rec = r2[0].records[0]
            result["habitat_status"]     = rec.values.get("habitat_status", "UNKNOWN")
            result["habitat_confidence"] = rec.values.get("confidence_score", 0)

        return result if result else None
    except Exception as e:
        logger.error(f"Prediction read error: {e}")
        return None


def get_prediction_history(hours: int = 24) -> list:
    """Prediction history আনে"""
    try:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "water_quality_prediction")
        |> filter(fn: (r) => r.pond_id == "{settings.POND_ID}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"])
        '''
        result = query_api.query(query, org=settings.INFLUXDB_ORG)
        history = []
        if result:
            for r in result[0].records:
                history.append({
                    "time"          : str(r.get_time()),
                    "water_quality" : r.values.get("quality_class", "UNKNOWN"),
                    "confidence"    : r.values.get("confidence_score", 0),
                })
        return history
    except Exception as e:
        logger.error(f"Prediction history error: {e}")
        return []


# ════════════════════════════════════════
# XAI EXPLANATIONS
# ════════════════════════════════════════

def save_xai_explanation(features: dict, shap_result: dict, model: str = "rf") -> bool:
    """SHAP explanation InfluxDB তে save করে"""
    try:
        importance = shap_result.get("feature_importance", {})
        point = (
            Point("xai_explanations")
            .tag("pond_id",       settings.POND_ID)
            .tag("model_version", model)
            .tag("top_feature",   shap_result.get("top_feature", "unknown"))
            .field("ph_importance",               importance.get("ph", 0.0))
            .field("water_temp_importance",        importance.get("water_temperature", 0.0))
            .field("turbidity_importance",         importance.get("turbidity", 0.0))
            .field("air_temp_importance",          importance.get("air_temperature", 0.0))
            .field("humidity_importance",          importance.get("humidity", 0.0))
            .field("rainfall_importance",          importance.get("rainfall", 0.0))
            .field("explanation_type",             shap_result.get("explanation_type", "unknown"))
            .time(datetime.now(timezone.utc), WritePrecision.SECONDS)
        )
        write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        logger.info("XAI explanation saved ✓")
        return True
    except Exception as e:
        logger.error(f"XAI save error: {e}")
        return False


# ════════════════════════════════════════
# FEEDING LOGS
# ════════════════════════════════════════

def save_feeding_log(mode: str, status: str, duration: int, reason: str) -> bool:
    """Feeding log InfluxDB তে save করে"""
    try:
        point = (
            Point("feeding_logs")
            .tag("pond_id",      settings.POND_ID)
            .tag("feeding_mode", mode)
            .field("feeding_status",   status)
            .field("duration_seconds", duration)
            .field("reason",           reason)
            .time(datetime.now(timezone.utc), WritePrecision.SECONDS)
        )
        write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        logger.info(f"Feeding log saved → mode:{mode} duration:{duration}s")
        return True
    except Exception as e:
        logger.error(f"Feeding log error: {e}")
        return False


def get_feeding_logs(hours: int = 24) -> list:
    """Feeding history আনে"""
    try:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "feeding_logs")
        |> filter(fn: (r) => r.pond_id == "{settings.POND_ID}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=settings.INFLUXDB_ORG)
        logs   = []
        if result:
            for r in result[0].records:
                logs.append({
                    "time"             : str(r.get_time()),
                    "mode"             : r.values.get("feeding_mode", "unknown"),
                    "status"           : r.values.get("feeding_status", "unknown"),
                    "duration_seconds" : r.values.get("duration_seconds", 0),
                    "reason"           : r.values.get("reason", ""),
                })
        return logs
    except Exception as e:
        logger.error(f"Feeding logs error: {e}")
        return []