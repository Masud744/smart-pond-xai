import shap
import numpy as np
import logging
import os
import joblib

logger = logging.getLogger(__name__)

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR   = os.path.join(BASE_DIR, "ml", "models")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
RF_PATH     = os.path.join(MODEL_DIR, "rf_model.pkl")

FEATURE_NAMES = [
    "ph",
    "water_temperature",
    "turbidity",
    "air_temperature",
    "humidity",
    "rainfall"
]

_explainer = None
_scaler    = None


def load_explainer():
    """SHAP explainer load করে"""
    global _explainer, _scaler
    try:
        if os.path.getsize(RF_PATH) > 0:
            model    = joblib.load(RF_PATH)
            _scaler  = joblib.load(SCALER_PATH)
            _explainer = shap.TreeExplainer(model)
            logger.info("SHAP explainer loaded ✓")
        else:
            logger.warning("RF model empty — SHAP not available")
    except Exception as e:
        logger.error(f"SHAP load error: {e}")


def get_shap_explanation(
    ph: float,
    water_temperature: float,
    turbidity: float,
    air_temperature: float,
    humidity: float,
    rainfall: float
) -> dict:
    """SHAP explanation generate করে"""

    if _explainer is None or _scaler is None:
        logger.warning("SHAP explainer not loaded — returning empty explanation")
        return _fallback_explanation(ph, water_temperature, turbidity,
                                     air_temperature, humidity, rainfall)

    try:
        features = np.array([[
            ph, water_temperature, turbidity,
            air_temperature, humidity, rainfall
        ]])

        features_scaled = _scaler.transform(features)
        shap_values     = _explainer.shap_values(features_scaled)

        # Random Forest — shap_values is list (one per class)
        # Use class with highest probability (index 0 = GOOD)
        if isinstance(shap_values, list):
            # Take absolute mean across classes for feature importance
            values = np.mean([np.abs(sv) for sv in shap_values], axis=0)[0]
        else:
            values = np.abs(shap_values[0])

        # Feature importance dict
        importance = {
            name: round(float(val), 6)
            for name, val in zip(FEATURE_NAMES, values)
        }

        # Sort by importance
        ranked = sorted(importance.items(), key=lambda x: x[1], reverse=True)

        return {
            "feature_importance" : importance,
            "ranked_features"    : [
                {"feature": k, "importance": v, "rank": i+1}
                for i, (k, v) in enumerate(ranked)
            ],
            "top_feature"        : ranked[0][0] if ranked else "unknown",
            "explanation_type"   : "shap_tree_explainer"
        }

    except Exception as e:
        logger.error(f"SHAP explanation error: {e}")
        return _fallback_explanation(ph, water_temperature, turbidity,
                                     air_temperature, humidity, rainfall)


def _fallback_explanation(ph, water_temperature, turbidity,
                          air_temperature, humidity, rainfall) -> dict:
    """SHAP unavailable হলে rule-based importance"""
    # Simple heuristic importance based on deviation from ideal
    ph_dev    = abs(ph - 7.0) / 7.0
    temp_dev  = abs(water_temperature - 26.0) / 26.0
    turb_dev  = turbidity / 100.0
    air_dev   = abs(air_temperature - 25.0) / 25.0
    hum_dev   = abs(humidity - 70.0) / 100.0
    rain_dev  = min(rainfall / 50.0, 1.0)

    importance = {
        "ph"               : round(ph_dev,   4),
        "water_temperature": round(temp_dev,  4),
        "turbidity"        : round(turb_dev,  4),
        "air_temperature"  : round(air_dev,   4),
        "humidity"         : round(hum_dev,   4),
        "rainfall"         : round(rain_dev,  4),
    }

    ranked = sorted(importance.items(), key=lambda x: x[1], reverse=True)

    return {
        "feature_importance" : importance,
        "ranked_features"    : [
            {"feature": k, "importance": v, "rank": i+1}
            for i, (k, v) in enumerate(ranked)
        ],
        "top_feature"      : ranked[0][0],
        "explanation_type" : "rule_based_fallback"
    }