import requests
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def get_weather():
    """OpenWeatherMap API বন্ধ রাখা হয়েছে Error এড়াতে"""
    return {
        "temperature" : 0.0,
        "humidity"    : 0,
        "rainfall"    : 0.0,
        "description" : "Weather disabled"
    }