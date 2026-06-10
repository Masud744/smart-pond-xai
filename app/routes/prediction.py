"""
prediction.py — ML Prediction Routes
=====================================
POST /api/predict        : manual prediction with custom values
POST /api/predict/auto   : auto prediction from latest sensor data
GET  /api/predict/latest : latest prediction from InfluxDB
GET  /api/predict/history: prediction history
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.ml_service import predict_fish
from app.services.shap_service import get_shap_explanation
from app.services.influx_service import (
    save_prediction, get_latest_prediction,
    get_prediction_history, save_xai_explanation,
    get_latest_reading
)
from app.services.weather_service import get_weather
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class PredictionRequest(BaseModel):
    ph          : float = Field(..., ge=0,   le=14,  description="Water pH")
    temperature : float = Field(..., ge=0,   le=50,  description="Water temperature °C")
    turbidity   : float = Field(..., ge=0,   le=100, description="Turbidity level")


@router.post("/predict")
async def run_prediction(data: PredictionRequest, model: str = Query(default="rf")):
    """
    Pond conditions দিয়ে fish suitability prediction + SHAP explanation।

    Example:
        POST /api/predict
        { "ph": 7.2, "temperature": 28, "turbidity": 5 }
    """

    # ML Prediction
    result = predict_fish(
        ph          = data.ph,
        temperature = data.temperature,
        turbidity   = data.turbidity
    )

    # SHAP Explanation
    shap_result = get_shap_explanation(
        ph          = data.ph,
        temperature = data.temperature,
        turbidity   = data.turbidity
    )

    now = datetime.now(timezone.utc).isoformat()

    # InfluxDB তে save
    save_prediction(
        recommended_fish   = result["recommended_fish"],
        confidence         = result["confidence"],
        water_quality      = result["water_quality"],
        habitat_status     = result["habitat_status"],
        model_version      = model
    )

    save_xai_explanation(
        features    = result["features_used"],
        shap_result = shap_result,
        model       = model
    )

    logger.info(
        f"Prediction → Fish:{result['recommended_fish']} "
        f"({result['confidence']*100:.1f}%) "
        f"Quality:{result['water_quality']}"
    )

    return {
        "recommended_fish" : result["recommended_fish"],
        "confidence"       : result["confidence"],
        "top3_fish"        : result["top3"],
        "water_quality"    : result["water_quality"],
        "habitat_status"   : result["habitat_status"],
        "xai_explanation"  : shap_result,
        "features_used"    : result["features_used"],
        "model"            : model,
        "timestamp"        : now
    }


@router.post("/predict/auto")
async def auto_predict():
    """
    Latest ESP32 sensor data দিয়ে automatic prediction।
    Weather data ও ব্যবহার করে context এর জন্য।
    """

    sensor = get_latest_reading()
    if not sensor:
        raise HTTPException(
            status_code=404,
            detail="No sensor data available. Make sure ESP32 is sending data."
        )

    result = predict_fish(
        ph          = sensor["ph"],
        temperature = sensor["temperature"],
        turbidity   = sensor["turbidity"]
    )

    shap_result = get_shap_explanation(
        ph          = sensor["ph"],
        temperature = sensor["temperature"],
        turbidity   = sensor["turbidity"]
    )

    weather = get_weather()

    save_prediction(
        recommended_fish = result["recommended_fish"],
        confidence       = result["confidence"],
        water_quality    = result["water_quality"],
        habitat_status   = result["habitat_status"],
        model_version    = "rf"
    )

    save_xai_explanation(
        features    = result["features_used"],
        shap_result = shap_result,
        model       = "rf"
    )

    return {
        "recommended_fish" : result["recommended_fish"],
        "confidence"       : result["confidence"],
        "top3_fish"        : result["top3"],
        "water_quality"    : result["water_quality"],
        "habitat_status"   : result["habitat_status"],
        "xai_explanation"  : shap_result,
        "sensor_data"      : sensor,
        "weather_context"  : weather,
        "timestamp"        : datetime.now(timezone.utc).isoformat()
    }


@router.get("/predict/latest")
async def get_latest():
    """InfluxDB থেকে সর্বশেষ prediction আনে"""
    data = get_latest_prediction()
    if not data:
        return {"message": "No predictions yet. Call POST /api/predict first.", "data": None}
    return {"data": data}


@router.get("/predict/history")
async def get_history(hours: int = Query(default=24, ge=1, le=168)):
    """Last N ঘন্টার prediction history"""
    data = get_prediction_history(hours=hours)
    return {
        "hours" : hours,
        "count" : len(data),
        "data"  : data
    }