# Architecture — Pond Management System

## 1. Project Overview

Pond-management-system is an IoT + ML assisted backend + dashboard.

- **ESP32** sends sensor readings (temperature, pH, turbidity, status) to the backend.
- **FastAPI backend** validates payloads (Pydantic), saves data in **InfluxDB**, and triggers **Telegram alerts** based on water quality status.
- **Dashboard endpoints** provide:
  - latest sensor reading
  - sensor history (time-series)
  - current status snapshot
- **Weather integration**: backend fetches current weather (OpenWeatherMap) to enrich the dashboard.
- **ML**: repo includes training/prediction scripts under `ml/` and service stubs under `app/services/` (e.g., `ml_service.py`, `shap_service.py`).
- **Frontend**: static HTML/CSS/JS calls backend APIs and renders UI.

## 2. High-Level Architecture (Layered)

### 2.1 API Layer (FastAPI)

Location: `app/routes/`

- `app/main.py` boots the FastAPI app and mounts routers.
- Routes are feature-based:
  - `sensor.py` — `POST /api/sensor`
  - `dashboard.py` — `GET /api/dashboard`, `GET /api/history`, `GET /api/status`
  - `prediction.py` — ML/prediction endpoints (present in repo)
  - `feeding.py` — fish feeding endpoints (present in repo)
  - `ota.py` — firmware OTA endpoints (present in repo)

### 2.2 Domain Models / Schemas

Location: `app/models/schemas.py`

- Defines Pydantic models:
  - `SensorData` for ESP32 ingress validation
  - `SensorResponse`, `WeatherData`, `DashboardResponse` for dashboard responses
  - `HistoryPoint` for history points

### 2.3 Service Layer

Location: `app/services/`

- `influx_service.py`
  - `save_sensor_data(...)`: writes sensor readings to InfluxDB
  - `get_latest_reading()`: returns last reading via Flux query
  - `get_history(hours)`: returns time-series history via Flux query
- `alert_service.py`
  - `check_and_alert(status, temp, ph, turbidity)`
  - Sends Telegram notifications when status transitions occur
  - Deduplicates notifications using `last_alerted_status` (in-memory)
- `weather_service.py`
  - `get_weather()` fetches current conditions from OpenWeatherMap
  - Extracts `temp`, `humidity`, and rainfall (`rain.1h` when available)
- `ml_service.py`
  - ML inference/training integration (routes expected to call it)
- `shap_service.py` (present in repo)
  - Intended for SHAP explanation generation (if used by prediction endpoints)

### 2.4 Data Access / Queries

Location: `app/services/queries/`

- Intended as a place to store reusable Flux query snippets/helpers.

## 3. Key Runtime Flows

### 3.1 Sensor Ingest Flow

1. ESP32 sends: `POST /api/sensor` with JSON body matching `SensorData`.
2. `app/routes/sensor.py`:
   - Calls `influx_service.save_sensor_data(...)`
   - Calls `alert_service.check_and_alert(...)`
3. `influx_service.save_sensor_data`:
   - Creates an Influx `Point("pond_sensor")`
   - Fields: `temperature`, `ph`, `turbidity`
   - Tag: `status`
   - Timestamp: `datetime.now(timezone.utc)`
4. `alert_service`:
   - If `status` is `POOR`/`MODERATE`, sends a Telegram message.
   - If recovered to `GOOD`, sends a recovery notification.

### 3.2 Dashboard Flow

- `GET /api/dashboard`
  - `influx_service.get_latest_reading()` (Flux: last reading + pivot)
  - `weather_service.get_weather()` (OpenWeatherMap request)
  - Response includes sensor + weather + `last_updated`

- `GET /api/history?hours=N`
  - `influx_service.get_history(hours=N)` (Flux: range + pivot + sort)
  - Returns an array of history points.

- `GET /api/status`
  - Returns only current sensor status, or `{status: "UNKNOWN"}` when no data exists.

## 4. External Integrations

### 4.1 InfluxDB

- Config: `app/config.py`
  - `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET`
- Queries: Flux language
  - Latest reading uses `range(start: -1h)` + `last()` + `pivot()`
  - History uses `range(start: -{hours}h)` + `pivot()` + `sort(columns: ["_time"])`

### 4.2 OpenWeatherMap

- Config: `OPENWEATHER_API_KEY`, `OPENWEATHER_CITY`, `OPENWEATHER_COUNTRY`
- Uses metric units (`units=metric`).
- Extracts rainfall only when `rain` field exists.

### 4.3 Telegram

- Config: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `alert_service.py` uses Telegram Bot API `sendMessage`.
- Messages are HTML-formatted (`parse_mode=HTML`).

## 5. Suggested Clean Architecture Improvements (Optional)

- Persist alert deduplication instead of in-memory `last_alerted_status` (e.g., Redis/DB), especially for multi-instance deployments.
- Move Flux query strings into `app/services/queries/` to centralize and test them.
- Add structured logging configuration via env-driven log levels.
- Ensure consistent response models usage across all routes (return Pydantic models rather than raw dicts).

## 6. Deployment/Container Notes

Repo contains Dockerfiles (backend/frontend). Recommended:

- Backend container runs `uvicorn app.main:app`.
- Frontend serves static assets (or via Nginx layer depending on Docker setup).
- Configure env vars for InfluxDB/Telegram/OpenWeather in container runtime.
