import joblib
import numpy as np
import logging
import os
from app.config import settings

logger = logging.getLogger(__name__)

# Model paths
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR  = os.path.join(BASE_DIR, "ml", "models")

RF_PATH    = os.path.join(MODEL_DIR, "rf_model.pkl")
XGB_PATH   = os.path.join(MODEL_DIR, "xgboost_model.pkl")
SCALER_PATH= os.path.join(MODEL_DIR, "scaler.pkl")

# Models — startup এ একবার load হবে
_rf_model  = None
_xgb_model = None
_scaler    = None


def load_models():
    """Models load করে — app startup এ call করা হয়"""
    global _rf_model, _xgb_model, _scaler
    try:
        if os.path.getsize(RF_PATH) > 0:
            _rf_model  = joblib.load(RF_PATH)
            _xgb_model = joblib.load(XGB_PATH)
            _scaler    = joblib.load(SCALER_PATH)
            logger.info("ML models loaded ✓")
        else:
            logger.warning("ML model files are empty — run ml/train.py first")
    except Exception as e:
        logger.error(f"Model load error: {e}")


def predict(
    ph: float,
    water_temperature: float,
    turbidity: float,
    air_temperature: float,
    humidity: float,
    rainfall: float,
    model: str = "rf"
) -> dict:
    """
    Prediction চালায়।
    Returns: water_quality, habitat_status, probabilities
    """
    if _rf_model is None or _xgb_model is None or _scaler is None:
        logger.warning("Models not loaded — using rule-based fallback")
        return _rule_based_predict(ph, water_temperature, turbidity)

    try:
        # Feature array — training এর সাথে exact same order
        features = np.array([[
            ph,
            water_temperature,
            turbidity,
            air_temperature,
            humidity,
            rainfall
        ]])

        # Scale
        features_scaled = _scaler.transform(features)

        # Model select
        active_model = _rf_model if model == "rf" else _xgb_model

        # Water Quality prediction
        quality_pred  = active_model.predict(features_scaled)[0]
        quality_proba = active_model.predict_proba(features_scaled)[0]

        # Water quality classes: 0=GOOD, 1=MODERATE, 2=POOR
        quality_map = {0: "GOOD", 1: "MODERATE", 2: "POOR"}
        quality_class = quality_map.get(int(quality_pred), "UNKNOWN")
        quality_conf  = float(max(quality_proba))

        # Fish habitat prediction (second output from same features)
        # habitat classes: 0=SUITABLE, 1=STRESS, 2=RISK
        habitat_map = {0: "SUITABLE", 1: "STRESS", 2: "RISK"}

        # Simple mapping from water quality to habitat
        habitat_class, habitat_conf = _derive_habitat(
            quality_class, quality_conf, ph, water_temperature, turbidity
        )

        return {
            "water_quality"      : quality_class,
            "habitat_status"     : habitat_class,
            "quality_confidence" : round(quality_conf, 4),
            "habitat_confidence" : round(habitat_conf, 4),
            "features_used"      : {
                "ph"               : ph,
                "water_temperature": water_temperature,
                "turbidity"        : turbidity,
                "air_temperature"  : air_temperature,
                "humidity"         : humidity,
                "rainfall"         : rainfall,
            }
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return _rule_based_predict(ph, water_temperature, turbidity)


def _derive_habitat(quality: str, quality_conf: float,
                    ph: float, temp: float, turbidity: int) -> tuple:
    """Water quality থেকে habitat status derive করে"""
    if quality == "GOOD":
        return "SUITABLE", quality_conf
    elif quality == "MODERATE":
        # Extra check — temp বা turbidity খুব খারাপ হলে STRESS
        if temp > 31 or turbidity > 50:
            return "STRESS", quality_conf * 0.9
        return "STRESS", quality_conf
    else:  # POOR
        return "RISK", quality_conf


def _rule_based_predict(ph: float, temp: float, turbidity: int) -> dict:
    """Models না থাকলে rule-based fallback"""
    ph_good   = settings.PH_GOOD_MIN <= ph <= settings.PH_GOOD_MAX
    temp_good = settings.TEMP_GOOD_MIN <= temp <= settings.TEMP_GOOD_MAX
    turb_good = turbidity <= settings.TURB_GOOD_MAX

    ph_mod    = settings.PH_MOD_MIN <= ph <= settings.PH_MOD_MAX
    turb_mod  = turbidity <= settings.TURB_MOD_MAX

    if ph_good and temp_good and turb_good:
        quality, habitat = "GOOD", "SUITABLE"
    elif ph_mod and turb_mod:
        quality, habitat = "MODERATE", "STRESS"
    else:
        quality, habitat = "POOR", "RISK"

    return {
        "water_quality"      : quality,
        "habitat_status"     : habitat,
        "quality_confidence" : 0.85,
        "habitat_confidence" : 0.85,
        "features_used"      : {"ph": ph, "water_temperature": temp, "turbidity": turbidity}
    }