"""
influx_service.py — Fixed version
WritePrecision.SECONDS → WritePrecision.S (new influxdb-client)
"""

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timezone
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client    = InfluxDBClient(
    url   = settings.INFLUXDB_URL,
    token = settings.INFLUXDB_TOKEN,
    org   = settings.INFLUXDB_ORG
)
write_api = client.write_api(write_options=SYNCHRONOUS)
query_api = client.query_api()

BUCKET = settings.INFLUXDB_BUCKET
ORG    = settings.INFLUXDB_ORG
POND   = settings.POND_ID
DEVICE = settings.DEVICE_ID

# WritePrecision fix — new version uses "s" string directly
WP = "s"


# ════════════════════════════════════════
# SENSOR DATA
# ════════════════════════════════════════

def save_sensor_data(temp: float, ph: float, turbidity: int, status: str) -> bool:
    try:
        point = (
    Point("water_sensor_data")
    .tag("pond_id", POND)
    .tag("device_id", DEVICE)
    .tag("status", status)          # <-- Changed from field to tag
    .field("water_temperature", float(temp))
    .field("ph", float(ph))
    .field("turbidity", int(turbidity))
    .time(datetime.now(timezone.utc), WP)
)

        write_api.write(
            bucket=BUCKET,
            org=ORG,
            record=point
        )

        logger.info(
            f"Sensor saved → pH:{ph} Temp:{temp} Turb:{turbidity} Status:{status}"
        )
        return True

    except Exception as e:
        logger.error(f"Sensor save error: {e}")
        return False

def get_latest_reading() -> dict | None:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -2h)
        |> filter(fn: (r) => r._measurement == "water_sensor_data")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        result = query_api.query(query, org=ORG)
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
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "water_sensor_data")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"])
        '''
        result  = query_api.query(query, org=ORG)
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
    try:
        point = (
            Point("weather_data")
            .tag("pond_id", POND)
            .field("air_temperature", float(weather.get("air_temperature", 0)))
            .field("humidity",        float(weather.get("humidity",        0)))
            .field("rainfall",        float(weather.get("rainfall",        0)))
            .field("wind_speed",      float(weather.get("wind_speed",      0)))
            .field("pressure",        float(weather.get("pressure",        0)))
            .time(datetime.now(timezone.utc), WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        logger.info("Weather saved ✓")
        return True
    except Exception as e:
        logger.error(f"Weather save error: {e}")
        return False


# ════════════════════════════════════════
# PREDICTIONS
# ════════════════════════════════════════

def save_prediction(
    recommended_fish: str,
    confidence: float,
    water_quality: str,
    habitat_status: str,
    model_version: str = "rf"
) -> bool:
    try:
        now = datetime.now(timezone.utc)
        p1  = (
            Point("water_quality_prediction")
            .tag("pond_id",       POND)
            .tag("model_version", model_version)
            .field("quality_class",    water_quality)
            .field("confidence_score", float(confidence))
            .time(now, WP)
        )
        p2  = (
            Point("fish_habitat_prediction")
            .tag("pond_id",       POND)
            .tag("model_version", model_version)
            .field("habitat_status",   habitat_status)
            .field("recommended_fish", recommended_fish)
            .field("confidence_score", float(confidence))
            .time(now, WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=[p1, p2])
        logger.info(f"Prediction saved → Fish:{recommended_fish} Quality:{water_quality}")
        return True
    except Exception as e:
        logger.error(f"Prediction save error: {e}")
        return False


def get_latest_prediction() -> dict | None:
    try:
        q1 = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -48h)
        |> filter(fn: (r) => r._measurement == "fish_habitat_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        q2 = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -48h)
        |> filter(fn: (r) => r._measurement == "water_quality_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> last()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        r1 = query_api.query(q1, org=ORG)
        r2 = query_api.query(q2, org=ORG)

        result = {}
        if r1 and r1[0].records:
            rec = r1[0].records[0]
            result["recommended_fish"]   = rec.values.get("recommended_fish", "unknown")
            result["habitat_status"]     = rec.values.get("habitat_status",   "unknown")
            result["habitat_confidence"] = rec.values.get("confidence_score", 0)
            result["timestamp"]          = str(rec.get_time())
        if r2 and r2[0].records:
            rec = r2[0].records[0]
            result["water_quality"]      = rec.values.get("quality_class",    "unknown")
            result["quality_confidence"] = rec.values.get("confidence_score", 0)

        return result if result else None
    except Exception as e:
        logger.error(f"Prediction read error: {e}")
        return None


def get_prediction_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "fish_habitat_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        '''
        result  = query_api.query(query, org=ORG)
        history = []
        if result:
            for r in result[0].records:
                history.append({
                    "time"            : str(r.get_time()),
                    "recommended_fish": r.values.get("recommended_fish", "unknown"),
                    "habitat_status"  : r.values.get("habitat_status",   "unknown"),
                    "confidence"      : r.values.get("confidence_score", 0),
                })
        return history
    except Exception as e:
        logger.error(f"Prediction history error: {e}")
        return []


# ════════════════════════════════════════
# XAI EXPLANATIONS
# ════════════════════════════════════════

def save_xai_explanation(features: dict, shap_result: dict, model: str = "rf") -> bool:
    try:
        importance = shap_result.get("feature_importance", {})
        point = (
            Point("xai_explanations")
            .tag("pond_id",       POND)
            .tag("model_version", model)
            .tag("top_feature",   shap_result.get("top_feature", "unknown"))
            .field("ph_importance",          float(importance.get("ph",          0)))
            .field("temperature_importance", float(importance.get("temperature", 0)))
            .field("turbidity_importance",   float(importance.get("turbidity",   0)))
            .field("explanation_type",       shap_result.get("explanation_type", "unknown"))
            .field("interpretation",         shap_result.get("interpretation",   ""))
            .time(datetime.now(timezone.utc), WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        logger.info("XAI explanation saved ✓")
        return True
    except Exception as e:
        logger.error(f"XAI save error: {e}")
        return False


# ════════════════════════════════════════
# FEEDING LOGS
# ════════════════════════════════════════

def save_feeding_log(mode: str, status: str, duration: int, reason: str) -> bool:
    try:
        point = (
            Point("feeding_logs")
            .tag("pond_id",      POND)
            .tag("feeding_mode", mode)
            .field("feeding_status",   status)
            .field("duration_seconds", int(duration))
            .field("reason",           reason)
            .time(datetime.now(timezone.utc), WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        logger.info(f"Feeding log saved → mode:{mode} duration:{duration}s")
        return True
    except Exception as e:
        logger.error(f"Feeding log error: {e}")
        return False


def get_feeding_logs(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "feeding_logs")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        logs   = []
        if result:
            for r in result[0].records:
                logs.append({
                    "time"             : str(r.get_time()),
                    "mode"             : r.values.get("feeding_mode",    "unknown"),
                    "status"           : r.values.get("feeding_status",  "unknown"),
                    "duration_seconds" : r.values.get("duration_seconds", 0),
                    "reason"           : r.values.get("reason",          ""),
                })
        return logs
    except Exception as e:
        logger.error(f"Feeding logs error: {e}")
        return []


# ════════════════════════════════════════
# ALERTS
# ════════════════════════════════════════

def save_alert(alert_type: str, severity: str, message: str) -> bool:
    try:
        point = (
            Point("alerts")
            .tag("pond_id",    POND)
            .tag("alert_type", alert_type)
            .tag("severity",   severity)
            .field("message",  message)
            .field("resolved", False)
            .time(datetime.now(timezone.utc), WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        logger.info(f"Alert saved → {alert_type} [{severity}]")
        return True
    except Exception as e:
        logger.error(f"Alert save error: {e}")
        return False