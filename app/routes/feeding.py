from fastapi import APIRouter, HTTPException
from app.models.schemas import FeedingRequest, FeedingResponse
from app.services.influx_service import save_feeding_log, get_feeding_logs
from app.services.influx_service import get_latest_reading
from app.config import settings
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/feed", response_model=FeedingResponse)
async def trigger_feeding(data: FeedingRequest):
    """Manual বা auto fish feeding trigger করে"""

    # Latest water status check
    sensor = get_latest_reading()
    if sensor and sensor.get("status") == "POOR":
        raise HTTPException(
            status_code=400,
            detail="Feeding cancelled — water quality is POOR. Fix water quality first."
        )

    duration = data.duration or settings.FEED_DURATION_SEC
    reason   = data.reason or f"{data.mode} feeding triggered"
    now      = datetime.now(timezone.utc).isoformat()

    # InfluxDB তে log করো
    saved = save_feeding_log(
        mode     = data.mode,
        status   = "COMPLETED",
        duration = duration,
        reason   = reason
    )

    if not saved:
        logger.warning("Feeding log save failed — but feeding executed")

    logger.info(f"Feeding triggered — mode:{data.mode} duration:{duration}s")

    return FeedingResponse(
        success          = True,
        feeding_status   = "COMPLETED",
        duration_seconds = duration,
        mode             = data.mode,
        reason           = reason,
        timestamp        = now
    )


@router.get("/feed/logs")
async def get_feeding_history(hours: int = 24):
    """Feeding history আনে"""
    logs = get_feeding_logs(hours=hours)
    return {
        "hours" : hours,
        "count" : len(logs),
        "data"  : logs
    }


@router.get("/feed/status")
async def get_feeding_status():
    """Latest feeding info"""
    logs = get_feeding_logs(hours=24)
    last = logs[0] if logs else None
    return {
        "last_feeding" : last,
        "total_today"  : len(logs)
    }