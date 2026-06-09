from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import sensor, dashboard, feeding, prediction, ota
from app.services.ml_service import load_models
from app.services.shap_service import load_explainer
import logging

logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

app = FastAPI(
    title       = "Smart Pond XAI API",
    description = "IoT + ML + XAI based Intelligent Pond Management System",
    version     = "2.0.0"
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# ── Routes ──
app.include_router(sensor.router,     prefix="/api", tags=["Sensor"])
app.include_router(dashboard.router,  prefix="/api", tags=["Dashboard"])
app.include_router(feeding.router,    prefix="/api", tags=["Feeding"])
app.include_router(prediction.router, prefix="/api", tags=["Prediction"])
app.include_router(ota.router,        prefix="/api", tags=["OTA"])


@app.on_event("startup")
async def startup_event():
    """App startup এ models load করো"""
    load_models()
    load_explainer()
    logging.getLogger(__name__).info("Smart Pond API started ✓")


@app.get("/")
async def root():
    return {
        "project" : "Smart Pond XAI System",
        "version" : "2.0.0",
        "status"  : "running",
        "docs"    : "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}