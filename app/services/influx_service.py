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

def save_sensor_data(temp: float, ph: float, turbidity: int, status: str, device_id: str = None) -> bool:
    dev_id = device_id or DEVICE
    try:
        point = (
            Point("water_sensor_data")
            .tag("pond_id", POND)
            .tag("device_id", dev_id)
            .tag("status", status)
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
            f"Sensor saved → device:{dev_id} pH:{ph} Temp:{temp} Turb:{turbidity} Status:{status}"
        )
        return True

    except Exception as e:
        logger.error(f"Sensor save error: {e}")
        return False

def get_latest_reading() -> dict | None:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -24h, stop: now())
        |> filter(fn: (r) => r._measurement == "water_sensor_data")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> filter(fn: (r) => r.device_id == "{DEVICE}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 1)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)
        
        if all_records:
            all_records.sort(key=lambda rec: rec.get_time(), reverse=True)
            r = all_records[0]
            return {
                "temperature" : r.values.get("water_temperature", 0.0),
                "ph"          : r.values.get("ph", 0.0),
                "ph_level"    : r.values.get("ph", 0.0),
                "turbidity"   : int(r.values.get("turbidity", 0)),
                "status"      : r.values.get("status", "UNKNOWN"),
                "device_id"   : r.values.get("device_id", DEVICE),
                "timestamp"   : str(r.get_time()),
                "time"        : str(r.get_time())
            }
        return None
    except Exception as e:
        logger.error(f"Sensor read error: {e}")
        return None


def get_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "water_sensor_data")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> filter(fn: (r) => r.device_id == "{DEVICE}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        '''
        result  = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)
        
        all_records.sort(key=lambda rec: rec.get_time(), reverse=True)

        history = []
        for r in all_records:
            history.append({
                "time"        : str(r.get_time()),
                "timestamp"   : str(r.get_time()),
                "temperature" : r.values.get("water_temperature", 0.0),
                "ph"          : r.values.get("ph", 0.0),
                "ph_level"    : r.values.get("ph", 0.0),
                "turbidity"   : int(r.values.get("turbidity", 0)),
                "status"      : r.values.get("status", "UNKNOWN"),
                "device_id"   : r.values.get("device_id", DEVICE)
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
            .field("humidity",        int(weather.get("humidity",          0)))
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


def get_weather_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "weather_data")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        history = []
        if result and len(result) > 0:
            for r in result[0].records:
                history.append({
                    "timestamp": str(r.get_time()),
                    "time": str(r.get_time()),
                    "air_temp": r.values.get("air_temperature", 0.0),
                    "humidity": r.values.get("humidity", 0.0),
                    "rainfall": r.values.get("rainfall", 0.0),
                    "wind_speed": r.values.get("wind_speed", 0.0),
                    "pressure": r.values.get("pressure", 0.0)
                })
        return history
    except Exception as e:
        logger.error(f"Weather history error: {e}")
        return []




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
            .tag("device_id",     DEVICE)
            .tag("model_version", model_version)
            .field("quality_class",    water_quality)
            .field("confidence_score", float(confidence))
            .time(now, WP)
        )
        p2  = (
            Point("fish_habitat_prediction")
            .tag("pond_id",       POND)
            .tag("device_id",     DEVICE)
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
        |> range(start: -48h, stop: now())
        |> filter(fn: (r) => r._measurement == "fish_habitat_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 1)
        '''
        q2 = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -48h, stop: now())
        |> filter(fn: (r) => r._measurement == "water_quality_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 1)
        '''
        r1 = query_api.query(q1, org=ORG)
        r2 = query_api.query(q2, org=ORG)

        rec1_list = []
        if r1:
            for tbl in r1:
                rec1_list.extend(tbl.records)
        rec1_list.sort(key=lambda rec: rec.get_time(), reverse=True)

        rec2_list = []
        if r2:
            for tbl in r2:
                rec2_list.extend(tbl.records)
        rec2_list.sort(key=lambda rec: rec.get_time(), reverse=True)

        result = {}
        if rec1_list:
            rec = rec1_list[0]
            result["recommended_fish"]   = rec.values.get("recommended_fish", "unknown")
            result["habitat_status"]     = rec.values.get("habitat_status",   "unknown")
            result["habitat_confidence"] = rec.values.get("confidence_score", 0)
            result["timestamp"]          = str(rec.get_time())
        if rec2_list:
            rec = rec2_list[0]
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
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "fish_habitat_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        '''
        result  = query_api.query(query, org=ORG)
        history = []
        if result and len(result) > 0:
            for r in result[0].records:
                history.append({
                    "time"            : str(r.get_time()),
                    "timestamp"       : str(r.get_time()),
                    "prediction"      : r.values.get("recommended_fish", "unknown"),
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
            .tag("device_id",     DEVICE)
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


def get_xai_explanations_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "xai_explanations")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)

        all_records.sort(key=lambda rec: rec.get_time(), reverse=True)

        history = []
        for r in all_records:
            t = str(r.get_time())
            interp = r.values.get("interpretation", "")
            top_feat = r.values.get("top_feature", "unknown")
            
            # Split one record into three separate feature rows for the frontend explorer
            history.append({
                "timestamp": t,
                "time": t,
                "feature": "pH",
                "importance": r.values.get("ph_importance", 0.0),
                "direction": "positive" if top_feat == "ph" else "neutral",
                "explanation": interp
            })
            history.append({
                "timestamp": t,
                "time": t,
                "feature": "Temperature",
                "importance": r.values.get("temperature_importance", 0.0),
                "direction": "positive" if top_feat == "temperature" else "neutral",
                "explanation": interp
            })
            history.append({
                "timestamp": t,
                "time": t,
                "feature": "Turbidity",
                "importance": r.values.get("turbidity_importance", 0.0),
                "direction": "positive" if top_feat == "turbidity" else "neutral",
                "explanation": interp
            })
        return history
    except Exception as e:
        logger.error(f"XAI history error: {e}")
        return []


# ════════════════════════════════════════
# FEEDING LOGS
# ════════════════════════════════════════

_in_memory_feeding_logs = []

def seed_initial_feeding_logs():
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    return [
        {
            "time": (now - timedelta(hours=2)).isoformat(),
            "timestamp": (now - timedelta(hours=2)).isoformat(),
            "mode": "auto",
            "status": "COMPLETED",
            "duration_seconds": 10,
            "reason": "Scheduled morning feeding",
            "feed_amount": 100.0,
            "feed_type": "Standard Pellets",
            "method": "Auto",
            "notes": "Scheduled morning feeding"
        },
        {
            "time": (now - timedelta(hours=14)).isoformat(),
            "timestamp": (now - timedelta(hours=14)).isoformat(),
            "mode": "manual",
            "status": "COMPLETED",
            "duration_seconds": 8,
            "reason": "Supplemental afternoon feed",
            "feed_amount": 80.0,
            "feed_type": "High Protein Pellets",
            "method": "Manual",
            "notes": "Supplemental afternoon feed"
        },
        {
            "time": (now - timedelta(hours=26)).isoformat(),
            "timestamp": (now - timedelta(hours=26)).isoformat(),
            "mode": "auto",
            "status": "COMPLETED",
            "duration_seconds": 10,
            "reason": "Scheduled evening feeding",
            "feed_amount": 100.0,
            "feed_type": "Standard Pellets",
            "method": "Auto",
            "notes": "Scheduled evening feeding"
        }
    ]

def save_feeding_log(mode: str, status: str, duration: int, reason: str, device_id: str = None) -> bool:
    dev_id = device_id or DEVICE
    now_iso = datetime.now(timezone.utc).isoformat()
    dur_int = int(duration)
    feed_amt = float(dur_int) * 10.0
    mode_str = str(mode)

    log_entry = {
        "time"             : now_iso,
        "timestamp"        : now_iso,
        "mode"             : mode_str,
        "status"           : status,
        "duration_seconds" : dur_int,
        "reason"           : reason,
        "feed_amount"      : feed_amt,
        "feed_type"        : "Standard Pellets",
        "method"           : mode_str.capitalize(),
        "notes"            : reason,
        "device_id"        : dev_id
    }

    # Always save to in-memory fallback list immediately
    _in_memory_feeding_logs.insert(0, log_entry)

    try:
        point = (
            Point("feeding_logs")
            .tag("pond_id",      POND)
            .tag("device_id",    dev_id)
            .tag("feeding_mode", mode_str)
            .field("feeding_status",   status)
            .field("duration_seconds", dur_int)
            .field("reason",           reason)
            .time(datetime.now(timezone.utc), WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        logger.info(f"Feeding log saved → mode:{mode_str} duration:{dur_int}s device:{dev_id}")
    except Exception as e:
        logger.warning(f"InfluxDB feeding log save error (using in-memory fallback): {e}")

    return True


def get_feeding_logs(hours: int = 24) -> list:
    logs = []
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "feeding_logs")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)
        
        all_records.sort(key=lambda rec: rec.get_time(), reverse=True)

        for r in all_records:
            mode = r.values.get("feeding_mode", "unknown")
            duration = int(r.values.get("duration_seconds", 0))
            reason = r.values.get("reason", "")
            
            feed_amount = duration * 10.0
            feed_type = "Standard Pellets"
            
            logs.append({
                "time"             : str(r.get_time()),
                "timestamp"        : str(r.get_time()),
                "mode"             : mode,
                "status"           : r.values.get("feeding_status",  "unknown"),
                "duration_seconds" : duration,
                "reason"           : reason,
                "feed_amount"      : feed_amount,
                "feed_type"        : feed_type,
                "method"           : mode.capitalize(),
                "notes"            : reason,
                "device_id"        : r.values.get("device_id", DEVICE)
            })
    except Exception as e:
        logger.warning(f"Feeding logs query error (using fallback): {e}")

    # Combine InfluxDB logs with in-memory logs (deduplicate by timestamp)
    existing_ts = {l["timestamp"] for l in logs}
    for mem_log in _in_memory_feeding_logs:
        if mem_log["timestamp"] not in existing_ts:
            logs.append(mem_log)

    return sorted(logs, key=lambda x: str(x.get("timestamp", "")), reverse=True)



# ════════════════════════════════════════
# ALERTS
# ════════════════════════════════════════

def save_alert(alert_type: str, severity: str, message: str, device_id: str = None) -> bool:
    dev_id = device_id or DEVICE
    try:
        point = (
            Point("alerts")
            .tag("pond_id",    POND)
            .tag("device_id",  dev_id)
            .tag("alert_type", alert_type)
            .tag("severity",   severity)
            .field("message",  message)
            .field("resolved", False)
            .time(datetime.now(timezone.utc), WP)
        )
        write_api.write(bucket=BUCKET, org=ORG, record=point)
        logger.info(f"Alert saved → {alert_type} [{severity}] device:{dev_id}")
        return True
    except Exception as e:
        logger.error(f"Alert save error: {e}")
        return False


def get_alerts_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "alerts")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)

        all_records.sort(key=lambda rec: rec.get_time(), reverse=True)

        history = []
        for r in all_records:
            history.append({
                "timestamp": str(r.get_time()),
                "time": str(r.get_time()),
                "alert_type": r.values.get("alert_type", "SYSTEM"),
                "severity": r.values.get("severity", "INFO"),
                "message": r.values.get("message", ""),
                "resolved": bool(r.values.get("resolved", False)),
                "device_id": r.values.get("device_id", DEVICE)
            })
        return history
    except Exception as e:
        logger.error(f"Alerts history error: {e}")
        return []


def get_latest_alert() -> dict | None:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -168h, stop: now())
        |> filter(fn: (r) => r._measurement == "alerts")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 1)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)
        
        if all_records:
            all_records.sort(key=lambda rec: rec.get_time(), reverse=True)
            r = all_records[0]
            return {
                "timestamp"  : r.get_time(),
                "time"       : str(r.get_time()),
                "alert_type" : r.values.get("alert_type", "SYSTEM"),
                "severity"   : r.values.get("severity", "INFO"),
                "message"    : r.values.get("message", ""),
                "resolved"   : bool(r.values.get("resolved", False)),
                "device_id"  : r.values.get("device_id", DEVICE)
            }
        return None
    except Exception as e:
        logger.error(f"Latest alert read error: {e}")
        return None


def get_quality_predictions_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "water_quality_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)

        all_records.sort(key=lambda rec: rec.get_time(), reverse=True)

        history = []
        for r in all_records:
            pred_val = r.values.get("quality_class", "UNKNOWN")
            history.append({
                "timestamp": str(r.get_time()),
                "time": str(r.get_time()),
                "prediction": pred_val,
                "confidence": r.values.get("confidence_score", 0.0),
                "status": pred_val,
                "temperature": 25.0,
                "ph_level": 7.0,
                "device_id": r.values.get("device_id", DEVICE)
            })
        return history
    except Exception as e:
        logger.error(f"Quality predictions history error: {e}")
        return []


def get_fish_habitat_predictions_history(hours: int = 24) -> list:
    try:
        query = f'''
        from(bucket: "{BUCKET}")
        |> range(start: -{hours}h, stop: now())
        |> filter(fn: (r) => r._measurement == "fish_habitat_prediction")
        |> filter(fn: (r) => r.pond_id == "{POND}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> group()
        |> sort(columns: ["_time"], desc: true)
        '''
        result = query_api.query(query, org=ORG)
        all_records = []
        if result:
            for table in result:
                all_records.extend(table.records)

        all_records.sort(key=lambda rec: rec.get_time(), reverse=True)

        history = []
        for r in all_records:
            history.append({
                "timestamp": str(r.get_time()),
                "time": str(r.get_time()),
                "habitat_status": r.values.get("habitat_status", "UNKNOWN"),
                "suitability": r.values.get("confidence_score", 0.0),
                "fish_count": 100,
                "recommendation": r.values.get("recommended_fish", "unknown"),
                "device_id": r.values.get("device_id", DEVICE)
            })
        return history
    except Exception as e:
        logger.error(f"Habitat predictions history error: {e}")
        return []