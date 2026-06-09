from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import PredictionRequest, PredictionResponse
from app.services.ml_service import predict
from app.services.shap_service import get_shap_explanation
from app.services.influx_service import (
    save_prediction, get_latest_prediction, get_prediction_history,
    save_xai_explanation, get_latest_reading
)
from app.services.weather_service import get_weather
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/predict", response_model=PredictionResponse)
async def run_prediction(data: PredictionRequest, model: str = Query(default="rf")):
    """ML prediction চালায় + SHAP explanation generate করে"""

    if model not in ["rf", "xgb"]:
        raise HTTPException(status_code=400, detail="model must be 'rf' or 'xgb'")

    # Prediction
    result = predict(
        ph                = data.ph,
        water_temperature = data.water_temperature,
        turbidity         = data.turbidity,
        air_temperature   = data.air_temperature,
        humidity          = data.humidity,
        rainfall          = data.rainfall,
        model             = model
    )

    # SHAP explanation
    shap_result = get_shap_explanation(
        ph                = data.ph,
        water_temperature = data.water_temperature,
        turbidity         = data.turbidity,
        air_temperature   = data.air_temperature,
        humidity          = data.humidity,
        rainfall          = data.rainfall
    )

    now = datetime.now(timezone.utc).isoformat()

    # InfluxDB তে save করো
    save_prediction(
        water_quality      = result["water_quality"],
        habitat_status     = result["habitat_status"],
        quality_confidence = result["quality_confidence"],
        habitat_confidence = result["habitat_confidence"],
        model_version      = model
    )

    save_xai_explanation(
        features    = result["features_used"],
        shap_result = shap_result,
        model       = model
    )

    logger.info(
        f"Prediction → Quality:{result['water_quality']} "
        f"Habitat:{result['habitat_status']} Model:{model}"
    )

    return PredictionResponse(
        water_quality      = result["water_quality"],
        habitat_status     = result["habitat_status"],
        quality_confidence = result["quality_confidence"],
        habitat_confidence = result["habitat_confidence"],
        shap_explanation   = shap_result,
        timestamp          = now
    )


@router.post("/predict/auto")
async def auto_predict():
    """Latest sensor + weather data দিয়ে automatic prediction"""

    sensor  = get_latest_reading()
    weather = get_weather()

    if not sensor:
        raise HTTPException(status_code=404, detail="No sensor data available")

    # Weather fallback
    air_temp  = weather["air_temperature"] if weather else 28.0
    humidity  = weather["humidity"]        if weather else 70.0
    rainfall  = weather["rainfall"]        if weather else 0.0

    result = predict(
        ph                = sensor["ph"],
        water_temperature = sensor["temperature"],
        turbidity         = sensor["turbidity"],
        air_temperature   = air_temp,
        humidity          = humidity,
        rainfall          = rainfall
    )

    shap_result = get_shap_explanation(
        ph                = sensor["ph"],
        water_temperature = sensor["temperature"],
        turbidity         = sensor["turbidity"],
        air_temperature   = air_temp,
        humidity          = humidity,
        rainfall          = rainfall
    )

    save_prediction(
        water_quality      = result["water_quality"],
        habitat_status     = result["habitat_status"],
        quality_confidence = result["quality_confidence"],
        habitat_confidence = result["habitat_confidence"],
        model_version      = "rf"
    )

    save_xai_explanation(
        features    = result["features_used"],
        shap_result = shap_result,
        model       = "rf"
    )

    return {
        "prediction"      : result,
        "shap_explanation": shap_result,
        "sensor_used"     : sensor,
        "weather_used"    : weather,
        "timestamp"       : datetime.now(timezone.utc).isoformat()
    }


@router.get("/predict/latest")
async def get_latest():
    """InfluxDB থেকে latest prediction আনে"""
    data = get_latest_prediction()
    if not data:
        return {"message": "No predictions yet", "data": None}
    return {"data": data}


@router.get("/predict/history")
async def get_history(hours: int = Query(default=24, ge=1, le=168)):
    """Prediction history আনে"""
    data = get_prediction_history(hours=hours)
    return {"hours": hours, "count": len(data), "data": data}