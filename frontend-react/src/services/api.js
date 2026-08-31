export const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'https://smart-pond-api.onrender.com/api';
const FALLBACK_API_BASE = 'https://smart-pond-api.onrender.com/api';

async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (API_BASE !== FALLBACK_API_BASE) {
      console.warn(`Primary API connection failed (${err.message}). Retrying fallback URL: ${FALLBACK_API_BASE}${endpoint}`);
      const res = await fetch(`${FALLBACK_API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    }
    throw err;
  }
}

async function apiPost(endpoint, body) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || `API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (API_BASE !== FALLBACK_API_BASE) {
      console.warn(`Primary API POST failed (${err.message}). Retrying fallback URL: ${FALLBACK_API_BASE}${endpoint}`);
      const res = await fetch(`${FALLBACK_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `API error: ${res.status}`);
      }
      return await res.json();
    }
    throw err;
  }
}

export const api = {
  getDashboard:   ()           => apiFetch('/dashboard'),
  getHistory:     (hours = 24) => apiFetch(`/history?hours=${hours}`),
  getWeather:     (hours = 24) => apiFetch(`/weather?hours=${hours}`),
  getPredictions: (hours = 24) => apiFetch(`/predictions?hours=${hours}`),
  getAlerts:      (hours = 24) => apiFetch(`/alerts?hours=${hours}`),
  getXAI:         (hours = 24) => apiFetch(`/xai?hours=${hours}`),
  getFeeding:     (hours = 24) => apiFetch(`/feeding?hours=${hours}`),
  getFishHabitat: (hours = 24) => apiFetch(`/fish-habitat?hours=${hours}`),
  
  // POST actions
  predictManual:  (data)       => apiPost('/predict', data),
  predictAuto:    ()           => apiPost('/predict/auto', {}),
  triggerFeed:    (data)       => apiPost('/feed', data),
};

