from fastapi import APIRouter, Query
from app.services.influx_service import get_latest_reading, get_history, get_latest_prediction, get_alerts_history
from app.services.weather_service import get_weather
from datetime import datetime, timezone

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_data():
    """Dashboard এর জন্য latest data + weather + predictions + alerts"""

    sensor  = get_latest_reading()
    weather = get_weather()
    pred = get_latest_prediction()
    
    # Calculate active (unresolved) alerts from last 24 hours
    alerts = get_alerts_history(hours=24)
    active_alerts = len([a for a in alerts if not a.get("resolved", False)])

    return {
        "sensor"       : sensor,
        "weather"      : weather,
        "latest_prediction": pred,
        "active_alerts": active_alerts,
        "last_updated" : datetime.now(timezone.utc).isoformat()
    }


@router.get("/history")
async def get_sensor_history(hours: int = Query(default=24, ge=1, le=168)):
    """Last N ঘন্টার history data — default 24 ঘন্টা"""

    history = get_history(hours=hours)

    return {
        "hours"   : hours,
        "count"   : len(history),
        "data"    : history
    }


@router.get("/status")
async def get_current_status():
    """শুধু current water status"""

    sensor = get_latest_reading()

    if not sensor:
        return {"status": "UNKNOWN", "message": "No data yet"}

    return {
        "status"      : sensor["status"],
        "temperature" : sensor["temperature"],
        "ph"          : sensor["ph"],
        "ph_level"    : sensor.get("ph_level"),
        "turbidity"   : sensor["turbidity"],
        "timestamp"   : sensor["timestamp"]
    }


# ─── Database Explorer Endpoints ───
from app.services.influx_service import (
    get_weather_history,
    get_quality_predictions_history,
    get_alerts_history,
    get_xai_explanations_history,
    get_feeding_logs,
    get_fish_habitat_predictions_history
)

@router.get("/weather")
async def get_weather_data_history(hours: int = Query(default=24, ge=1, le=168)):
    data = get_weather_history(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}

@router.get("/predictions")
async def get_predictions_data_history(hours: int = Query(default=24, ge=1, le=168)):
    data = get_quality_predictions_history(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}

@router.get("/alerts")
async def get_alerts_data_history(hours: int = Query(default=24, ge=1, le=168)):
    data = get_alerts_history(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}

@router.get("/xai")
async def get_xai_data_history(hours: int = Query(default=24, ge=1, le=168)):
    data = get_xai_explanations_history(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}

@router.get("/feeding")
async def get_feeding_data_history(hours: int = Query(default=24, ge=1, le=168)):
    data = get_feeding_logs(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}

@router.get("/fish-habitat")
async def get_fish_habitat_data_history(hours: int = Query(default=24, ge=1, le=168)):
    data = get_fish_habitat_predictions_history(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}