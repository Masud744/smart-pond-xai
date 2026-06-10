"""
ml_service.py
=============
Real fish habitat suitability prediction using trained RF model.
Input  : pH, temperature, turbidity (from ESP32 sensors)
Output : recommended fish + top 3 alternatives + confidence
"""

import joblib
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)

# ── Paths ──
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR   = os.path.join(BASE_DIR, "ml", "models")

RF_PATH     = os.path.join(MODEL_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
LE_PATH     = os.path.join(MODEL_DIR, "label_encoder.pkl")

# ── In-memory model cache ──
_rf_model = None
_scaler   = None
_le       = None


def load_models():
    """App startup এ একবার models load করে"""
    global _rf_model, _scaler, _le
    try:
        if os.path.exists(RF_PATH) and os.path.getsize(RF_PATH) > 0:
            _rf_model = joblib.load(RF_PATH)
            _scaler   = joblib.load(SCALER_PATH)
            _le       = joblib.load(LE_PATH)
            logger.info(f"ML models loaded ✓ Classes: {list(_le.classes_)}")
        else:
            logger.warning("ML model files missing or empty — run ml/train.py first")
    except Exception as e:
        logger.error(f"Model load error: {e}")


def predict_fish(ph: float, temperature: float, turbidity: float) -> dict:
    """
    Pond conditions দিয়ে সবচেয়ে suitable fish predict করে।

    Returns:
        recommended_fish : সবচেয়ে suitable মাছের নাম
        confidence       : confidence score (0-1)
        top3             : top 3 alternatives with probabilities
        all_probabilities: সব মাছের probability
        water_quality    : GOOD/MODERATE/POOR (rule-based)
        habitat_status   : SUITABLE/STRESS/RISK
    """
    if _rf_model is None or _scaler is None or _le is None:
        logger.warning("Models not loaded — using rule-based fallback")
        return _rule_based_fallback(ph, temperature, turbidity)

    try:
        features        = np.array([[ph, temperature, turbidity]])
        features_scaled = _scaler.transform(features)

        # Prediction
        pred_idx = _rf_model.predict(features_scaled)[0]
        proba    = _rf_model.predict_proba(features_scaled)[0]

        # Top 3 fish
        top3_idx = np.argsort(proba)[::-1][:3]
        top3 = [
            {
                "fish":       _le.classes_[i],
                "confidence": round(float(proba[i]), 4),
                "rank":       rank + 1
            }
            for rank, i in enumerate(top3_idx)
        ]

        # All probabilities
        all_proba = {
            fish: round(float(prob), 4)
            for fish, prob in zip(_le.classes_, proba)
        }

        # Water quality assessment (rule-based)
        water_quality, habitat_status = _assess_water_quality(ph, temperature, turbidity)

        return {
            "recommended_fish" : _le.classes_[pred_idx],
            "confidence"       : round(float(proba[pred_idx]), 4),
            "top3"             : top3,
            "all_probabilities": all_proba,
            "water_quality"    : water_quality,
            "habitat_status"   : habitat_status,
            "features_used"    : {
                "ph"          : ph,
                "temperature" : temperature,
                "turbidity"   : turbidity,
            }
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return _rule_based_fallback(ph, temperature, turbidity)


def _assess_water_quality(ph: float, temp: float, turbidity: float) -> tuple:
    """Rule-based water quality assessment"""
    ph_good   = 6.5 <= ph <= 8.5
    temp_good = 20.0 <= temp <= 32.0
    turb_good = turbidity <= 30

    ph_mod    = 6.0 <= ph <= 9.0
    turb_mod  = turbidity <= 60

    if ph_good and temp_good and turb_good:
        return "GOOD", "SUITABLE"
    elif ph_mod and turb_mod:
        return "MODERATE", "STRESS"
    else:
        return "POOR", "RISK"


def _rule_based_fallback(ph: float, temp: float, turbidity: float) -> dict:
    """Models না থাকলে rule-based recommendation"""
    water_quality, habitat_status = _assess_water_quality(ph, temp, turbidity)

    # Simple rule-based fish recommendation
    if 6.5 <= ph <= 8.5 and 20 <= temp <= 30 and turbidity <= 10:
        fish = "tilapia"
    elif 6.0 <= ph <= 8.9 and 20 <= temp <= 35:
        fish = "rui"
    elif 6.5 <= ph <= 9.0 and 17 <= temp <= 31:
        fish = "pangas"
    else:
        fish = "tilapia"  # most hardy

    return {
        "recommended_fish" : fish,
        "confidence"       : 0.75,
        "top3"             : [{"fish": fish, "confidence": 0.75, "rank": 1}],
        "all_probabilities": {fish: 0.75},
        "water_quality"    : water_quality,
        "habitat_status"   : habitat_status,
        "features_used"    : {"ph": ph, "temperature": temp, "turbidity": turbidity}
    }