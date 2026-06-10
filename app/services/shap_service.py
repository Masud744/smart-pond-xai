"""
shap_service.py — Fixed version
Fixes: only length-1 arrays can be converted to Python scalars
"""

import numpy as np
import logging
import os
import joblib

logger = logging.getLogger(__name__)

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR   = os.path.join(BASE_DIR, "ml", "models")
RF_PATH     = os.path.join(MODEL_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

FEATURE_NAMES = ["ph", "temperature", "turbidity"]

_explainer = None
_scaler    = None


def load_explainer():
    global _explainer, _scaler
    try:
        import shap
        if os.path.exists(RF_PATH) and os.path.getsize(RF_PATH) > 0:
            model      = joblib.load(RF_PATH)
            _scaler    = joblib.load(SCALER_PATH)
            _explainer = shap.TreeExplainer(model)
            logger.info("SHAP explainer loaded ✓")
        else:
            logger.warning("RF model empty — SHAP using fallback")
    except ImportError:
        logger.warning("SHAP not installed — using fallback")
    except Exception as e:
        logger.error(f"SHAP load error: {e}")


def get_shap_explanation(ph: float, temperature: float, turbidity: float) -> dict:
    if _explainer is None or _scaler is None:
        return _fallback_explanation(ph, temperature, turbidity)

    try:
        features        = np.array([[ph, temperature, turbidity]])
        features_scaled = _scaler.transform(features)
        shap_values     = _explainer.shap_values(features_scaled)

        # Fix: handle both list and ndarray, extract scalar values safely
        if isinstance(shap_values, list):
            # List of arrays — one per class. Shape: (n_classes, n_samples, n_features)
            # Take mean absolute across all classes
            abs_shap = np.mean(
                [np.abs(np.array(sv)).flatten() for sv in shap_values],
                axis=0
            )
        else:
            abs_shap = np.abs(np.array(shap_values)).flatten()

        # Ensure we have exactly 3 values
        if len(abs_shap) != 3:
            abs_shap = abs_shap[:3]

        # Normalize
        total = float(abs_shap.sum())
        if total > 0:
            normalized = abs_shap / total
        else:
            normalized = abs_shap

        importance = {
            name: round(float(val), 4)
            for name, val in zip(FEATURE_NAMES, normalized)
        }

        importance_pct = {
            name: round(float(val) * 100, 1)
            for name, val in importance.items()
        }

        ranked = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        ranked_features = [
            {
                "rank"           : i + 1,
                "feature"        : k,
                "importance"     : v,
                "importance_pct" : round(v * 100, 1),
                "description"    : _feature_description(k, ph, temperature, turbidity)
            }
            for i, (k, v) in enumerate(ranked)
        ]

        return {
            "feature_importance" : importance,
            "importance_pct"     : importance_pct,
            "ranked_features"    : ranked_features,
            "top_feature"        : ranked[0][0],
            "interpretation"     : _generate_interpretation(ranked_features, ph, temperature, turbidity),
            "explanation_type"   : "shap_tree_explainer"
        }

    except Exception as e:
        logger.error(f"SHAP explanation error: {e}")
        return _fallback_explanation(ph, temperature, turbidity)


def _feature_description(feature: str, ph: float, temp: float, turbidity: float) -> str:
    if feature == "ph":
        if ph < 6.0:
            return f"pH {ph} — Too acidic (ideal: 6.5-8.5)"
        elif ph > 9.0:
            return f"pH {ph} — Too alkaline (ideal: 6.5-8.5)"
        else:
            return f"pH {ph} — Within normal range (6.5-8.5)"
    elif feature == "temperature":
        if temp < 18:
            return f"{temp}°C — Too cold for most fish"
        elif temp > 33:
            return f"{temp}°C — Too warm, may cause stress"
        else:
            return f"{temp}°C — Suitable temperature range"
    elif feature == "turbidity":
        if turbidity < 10:
            return f"Turbidity {turbidity} — Very clear water"
        elif turbidity > 60:
            return f"Turbidity {turbidity} — High turbidity, poor visibility"
        else:
            return f"Turbidity {turbidity} — Moderate clarity"
    return ""


def _generate_interpretation(ranked: list, ph: float, temp: float, turbidity: float) -> str:
    top    = ranked[0]
    second = ranked[1] if len(ranked) > 1 else None
    lines  = [
        f"The fish recommendation is primarily driven by "
        f"{top['feature'].upper()} ({top['importance_pct']}% contribution)."
    ]
    if second:
        lines.append(
            f"{second['feature'].upper()} is the second most important factor "
            f"({second['importance_pct']}% contribution)."
        )
    lines.append(_feature_description(top["feature"], ph, temp, turbidity))
    return " ".join(lines)


def _fallback_explanation(ph: float, temp: float, turbidity: float) -> dict:
    ph_dev   = abs(ph - 7.0) / 7.0
    temp_dev = abs(temp - 26.0) / 26.0
    turb_dev = min(turbidity / 100.0, 1.0)

    raw   = {"ph": ph_dev, "temperature": temp_dev, "turbidity": turb_dev}
    total = sum(raw.values()) or 1.0
    importance = {k: round(v / total, 4) for k, v in raw.items()}

    ranked = sorted(importance.items(), key=lambda x: x[1], reverse=True)
    ranked_features = [
        {
            "rank"           : i + 1,
            "feature"        : k,
            "importance"     : v,
            "importance_pct" : round(v * 100, 1),
            "description"    : _feature_description(k, ph, temp, turbidity)
        }
        for i, (k, v) in enumerate(ranked)
    ]

    return {
        "feature_importance" : importance,
        "importance_pct"     : {k: round(v * 100, 1) for k, v in importance.items()},
        "ranked_features"    : ranked_features,
        "top_feature"        : ranked[0][0],
        "interpretation"     : _generate_interpretation(ranked_features, ph, temp, turbidity),
        "explanation_type"   : "rule_based_fallback"
    }