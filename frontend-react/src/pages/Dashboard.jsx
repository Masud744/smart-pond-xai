import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Thermometer, FlaskConical, Eye, CloudSun, Fish, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{
      background: '#161b22', border: '1px solid #21262d',
      borderRadius: 12, padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}20`, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em', fontFamily: 'JetBrains Mono, monospace' }}>
          {value != null ? String(value) : '—'}
          {unit && value != null && <span style={{ fontSize: 13, fontWeight: 500, color: '#8b949e', marginLeft: 3 }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1c2333', border: '1px solid #30363d', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#8b949e', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.name}</span>
          <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [dashboard,   setDashboard]   = useState(null);
  const [history,     setHistory]     = useState([]);
  const [prediction,  setPrediction]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dash, hist, pred] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getHistory(24).catch(() => ({ data: [] })),
        api.getLatestPrediction().catch(() => null),
      ]);
      setDashboard(dash);
      setHistory(Array.isArray(hist) ? hist : (hist?.data ?? []));
      setPrediction(pred?.data ?? null);
      setLastUpdated(format(new Date(), 'HH:mm:ss'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  // dashboard response: { sensor: {...}, weather: {...}, last_updated }
  const sensor  = dashboard?.sensor;
  const weather = dashboard?.weather;

  // chart data from history
  const chartData = history.slice(-30).map(r => ({
    time:      r.timestamp ? format(new Date(r.timestamp), 'HH:mm') : '',
    temp:      r.temperature != null ? +Number(r.temperature).toFixed(2) : null,
    ph:        r.ph         != null ? +Number(r.ph).toFixed(2)          : null,
    turbidity: r.turbidity  != null ? +Number(r.turbidity).toFixed(1)   : null,
  }));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>Real-time IoT intelligence and Machine Learning monitoring</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
              <span className="pulse-dot" />
              <span>Live</span>
              <span style={{ color: '#484f58' }}>|</span>
              <span>Updated {lastUpdated}</span>
            </div>
          )}
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px', color: '#f85149', fontSize: 13,
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* KPI Cards — sensor + weather */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <KpiCard icon={Thermometer} label="Water Temperature" unit="°C"  color="#f59e0b"
          value={sensor?.temperature != null ? Number(sensor.temperature).toFixed(2) : null} />
        <KpiCard icon={FlaskConical} label="pH Level"         color="#3b82f6"
          value={sensor?.ph          != null ? Number(sensor.ph).toFixed(2)          : null} />
        <KpiCard icon={Eye}          label="Turbidity"        unit="%"   color="#8b5cf6"
          value={sensor?.turbidity   != null ? sensor.turbidity                       : null} />
        <KpiCard icon={CloudSun}     label="Air Temperature"  unit="°C"  color="#06b6d4"
          value={weather?.air_temp   != null ? Number(weather.air_temp).toFixed(1)   : null} />
        <KpiCard icon={Fish}         label="Recommended Fish" color="#3fb950"
          value={prediction?.recommended_fish ?? null} />
        <KpiCard icon={Zap}          label="Habitat Status"   color="#e3b341"
          value={prediction?.habitat_status   ?? null} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
            Water Quality — Last 24h
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b949e' }} interval="preserveStartEnd" />
                <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#8b949e' }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="l" type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f59e0b" dot={false} strokeWidth={2} />
                <Line yAxisId="r" type="monotone" dataKey="ph"   name="pH"        stroke="#3b82f6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading chart…' : 'No history data yet'}
            </div>
          )}
        </div>

        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
            Turbidity — Last 24h
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b949e' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="turbidity" name="Turbidity (%)" stroke="#8b5cf6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading chart…' : 'No history data yet'}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#8b949e' }}>Water Status</span>
        {sensor?.status ? (
          <span className={
            sensor.status === 'GOOD'     ? 'status-good' :
            sensor.status === 'MODERATE' ? 'status-warning' : 'status-critical'
          }>{sensor.status}</span>
        ) : (
          <span style={{ fontSize: 13, color: '#8b949e' }}>—</span>
        )}
        {weather && (
          <>
            <span style={{ color: '#30363d' }}>|</span>
            <span style={{ fontSize: 12, color: '#8b949e' }}>
              💧 Humidity: {weather.humidity ?? '—'}%
              &nbsp;&nbsp;🌧 Rainfall: {weather.rainfall ?? 0} mm
              &nbsp;&nbsp;💨 Wind: {weather.wind_speed ?? '—'} km/h
            </span>
          </>
        )}
        {lastUpdated && (
          <span style={{ fontSize: 12, color: '#8b949e', marginLeft: 'auto' }}>
            Last sync: {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
}
