from fastapi import APIRouter, HTTPException
from app.models.schemas import SensorData
from app.services.influx_service import save_sensor_data
from app.services.alert_service import check_and_alert
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def calculate_status(ph: float, temp: float, turbidity: int) -> str:
    """Sensor values থেকে water status calculate করে"""
    ph_good   = 6.5 <= ph <= 8.5
    temp_good = 20.0 <= temp <= 32.0
    turb_good = turbidity <= 30

    ph_mod  = 6.0 <= ph <= 9.0
    turb_mod = turbidity <= 60

    if ph_good and temp_good and turb_good:
        return "GOOD"
    elif ph_mod and turb_mod:
        return "MODERATE"
    else:
        return "POOR"


@router.post("/sensor")
async def receive_sensor_data(data: SensorData):
    """ESP32 থেকে sensor data receive করে"""

    # Status auto-calculate
    status = data.status or calculate_status(
        data.ph, data.temperature, data.turbidity
    )

    saved = save_sensor_data(
        temp      = data.temperature,
        ph        = data.ph,
        turbidity = data.turbidity,
        status    = status
    )

    if not saved:
        raise HTTPException(status_code=500, detail="Database save failed")

    check_and_alert(
        status    = status,
        temp      = data.temperature,
        ph        = data.ph,
        turbidity = data.turbidity
    )

    logger.info(f"Data received → {status}")

    return {
        "success" : True,
        "message" : "Data saved",
        "status"  : status
    }