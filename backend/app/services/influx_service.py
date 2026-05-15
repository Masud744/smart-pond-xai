from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timezone
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# ── Client ──
client = InfluxDBClient(
    url   = settings.INFLUXDB_URL,
    token = settings.INFLUXDB_TOKEN,
    org   = settings.INFLUXDB_ORG
)

write_api = client.write_api(write_options=SYNCHRONOUS)
query_api = client.query_api()


def save_sensor_data(temp: float, ph: float, turbidity: int, status: str):
    """ESP32 থেকে আসা data InfluxDB তে save করে"""
    try:
        point = (
            Point("pond_sensor")
            .field("temperature", temp)
            .field("ph",          ph)
            .field("turbidity",   turbidity)
            .tag("status",        status)
            .time(datetime.now(timezone.utc), WritePrecision.S)
        )
        write_api.write(
            bucket = settings.INFLUXDB_BUCKET,
            org    = settings.INFLUXDB_ORG,
            record = point
        )
        logger.info(f"Data saved → Temp:{temp} pH:{ph} Turb:{turbidity}")
        return True

    except Exception as e:
        logger.error(f"InfluxDB write error: {e}")
        return False


def get_latest_reading():
    """সবচেয়ে সাম্প্রতিক sensor data আনে"""
    try:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "pond_sensor")
        |> last()
        |> pivot(
            rowKey:      ["_time"],
            columnKey:   ["_field"],
            valueColumn: "_value"
        )
        '''
        result = query_api.query(query, org=settings.INFLUXDB_ORG)
        if result and result[0].records:
            record = result[0].records[0]
            return {
                "temperature" : record["temperature"],
                "ph"          : record["ph"],
                "turbidity"   : int(record["turbidity"]),
                "status"      : record.values.get("status", "UNKNOWN"),
                "timestamp"   : str(record.get_time())
            }
        return None

    except Exception as e:
        logger.error(f"InfluxDB read error: {e}")
        return None


def get_history(hours: int = 24):
    """Last N ঘন্টার sensor data আনে"""
    try:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "pond_sensor")
        |> pivot(
            rowKey:      ["_time"],
            columnKey:   ["_field"],
            valueColumn: "_value"
        )
        |> sort(columns: ["_time"])
        '''
        result  = query_api.query(query, org=settings.INFLUXDB_ORG)
        history = []

        if result:
            for record in result[0].records:
                history.append({
                    "time"        : str(record.get_time()),
                    "temperature" : record["temperature"],
                    "ph"          : record["ph"],
                    "turbidity"   : int(record["turbidity"]),
                    "status"      : record.values.get("status", "UNKNOWN")
                })
        return history

    except Exception as e:
        logger.error(f"InfluxDB history error: {e}")
        return []