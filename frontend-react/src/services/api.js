// ── Backend: FastAPI on http://127.0.0.1:8000 ──
// Vite proxy → /api/* → http://127.0.0.1:8000/api/*
const API_BASE = '/api';

async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Dashboard — returns { sensor, weather, last_updated }
  getDashboard: () => apiFetch('/dashboard'),

  // Sensor history — returns { hours, count, data: [...] }
  getHistory: (hours = 24) => apiFetch(`/history?hours=${hours}`),

  // Current status — returns { status, temperature, ph, turbidity, timestamp }
  getStatus: () => apiFetch('/status'),

  // Feeding logs — returns { hours, count, data: [...] }
  getFeeding: (hours = 24) => apiFetch(`/feed/logs?hours=${hours}`),
  getFeedingStatus: () => apiFetch('/feed/status'),

  // Predictions — returns { hours, count, data: [...] }
  // Each item has: recommended_fish, confidence, water_quality,
  //                habitat_status, xai_explanation, timestamp
  getPredictions: (hours = 24) => apiFetch(`/predict/history?hours=${hours}`),
  getLatestPrediction: () => apiFetch('/predict/latest'),

  // Auto predict from latest sensor
  runAutoPrediction: () => fetch(`${API_BASE}/predict/auto`, { method: 'POST' }).then(r => r.json()),
};
