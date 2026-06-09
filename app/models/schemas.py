from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ── ESP32 থেকে আসা data ──
class SensorData(BaseModel):
    temperature : float = Field(..., ge=-10, le=100)
    ph          : float = Field(..., ge=0,   le=14)
    turbidity   : int   = Field(..., ge=0,   le=100)
    status      : Optional[str] = Field(None, pattern="^(GOOD|MODERATE|POOR)$")

# ── Dashboard এ যাওয়া data ──
class SensorResponse(BaseModel):
    temperature : float
    ph          : float
    turbidity   : int
    status      : str
    timestamp   : str

class WeatherData(BaseModel):
    air_temperature : float
    humidity        : float
    rainfall        : float
    wind_speed      : float
    pressure        : float

class DashboardResponse(BaseModel):
    sensor       : Optional[SensorResponse]
    weather      : Optional[WeatherData]
    last_updated : str

# ── History ──
class HistoryPoint(BaseModel):
    time        : str
    temperature : float
    ph          : float
    turbidity   : int
    status      : str

# ── ML Prediction ──
class PredictionRequest(BaseModel):
    ph              : float = Field(..., ge=0,    le=14)
    water_temperature : float = Field(..., ge=0,  le=50)
    turbidity       : float = Field(..., ge=0,    le=100)
    air_temperature : float = Field(..., ge=-10,  le=50)
    humidity        : float = Field(..., ge=0,    le=100)
    rainfall        : float = Field(..., ge=0,    le=500)

class PredictionResponse(BaseModel):
    water_quality     : str
    habitat_status    : str
    quality_confidence  : float
    habitat_confidence  : float
    shap_explanation  : Optional[dict] = None
    timestamp         : str

# ── Feeding ──
class FeedingRequest(BaseModel):
    mode     : str = Field(..., pattern="^(manual|auto)$")
    duration : Optional[int] = Field(default=5, ge=1, le=60)
    reason   : Optional[str] = None

class FeedingResponse(BaseModel):
    success          : bool
    feeding_status   : str
    duration_seconds : int
    mode             : str
    reason           : str
    timestamp        : str

# ── Alert ──
class AlertLog(BaseModel):
    timestamp  : str
    alert_type : str
    severity   : str
    message    : str
    resolved   : bool