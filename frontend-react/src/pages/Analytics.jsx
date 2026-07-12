import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { RefreshCw, TrendingUp, Download, Eye, Layers, Percent, Thermometer } from 'lucide-react';
import { api } from '../services/api';

/* ─── Premium Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(7, 10, 19, 0.9)', border: '1px solid var(--border-color)',
      borderRadius: 12, padding: '12px 16px', fontSize: 12,
      backdropFilter: 'blur(8px)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>Time: {label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
            </div>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ title, min, max, avg, color }) {
  return (
    <div className="card-premium" style={{ flex: '1 1 240px' }}>
      <div style={{ fontSize: 13, color, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        {[['Min', min], ['Max', max], ['Avg', avg]].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [weather, setWeather] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [lastUpd, setLastUpd] = useState('');
  
  // Custom interactive state
  const [activeSeries, setActiveSeries] = useState({ temp: true, ph: true, turbidity: true });
  const [compareMode, setCompareMode] = useState(false); // overlay air vs water temp

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, w] = await Promise.all([
        api.getHistory(hours).catch(() => []),
        api.getWeather(hours).catch(() => []),
      ]);
      setHistory(Array.isArray(h) ? h : h?.data ?? []);
      setWeather(Array.isArray(w) ? w : w?.data ?? []);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  const sensorData = history.map(r => ({
    time: r.timestamp ? format(new Date(r.timestamp), 'MM/dd HH:mm') : '',
    temp: typeof r.temperature === 'number' ? +r.temperature.toFixed(2) : null,
    ph: typeof r.ph_level === 'number' ? +r.ph_level.toFixed(2) : null,
    turbidity: r.turbidity != null ? +Number(r.turbidity).toFixed(1) : null,
  }));

  const weatherData = weather.map(r => ({
    time: r.timestamp ? format(new Date(r.timestamp), 'MM/dd HH:mm') : '',
    air_temp: r.air_temp != null ? +Number(r.air_temp).toFixed(2) : null,
    humidity: r.humidity != null ? +Number(r.humidity).toFixed(1) : null,
    wind: r.wind_speed != null ? +Number(r.wind_speed).toFixed(1) : null,
    pressure: r.pressure != null ? +Number(r.pressure).toFixed(1) : null,
  }));

  // Correlation study calculation
  const calculateCorrelation = () => {
    if (sensorData.length === 0 || weatherData.length === 0) return '—';
    // Match timestamps roughly and evaluate Pearson correlation between Air Temp and Water Temp
    const len = Math.min(sensorData.length, weatherData.length);
    if (len < 5) return 'Insufficient data';
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    let count = 0;
    
    for (let i = 0; i < len; i++) {
      const x = sensorData[i].temp;
      const y = weatherData[i]?.air_temp;
      if (x != null && y != null) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
        count++;
      }
    }
    
    if (count === 0) return '—';
    const num = (count * sumXY) - (sumX * sumY);
    const den = Math.sqrt(((count * sumX2) - (sumX * sumX)) * ((count * sumY2) - (sumY * sumY)));
    if (den === 0) return '0.00';
    return (num / den).toFixed(2);
  };

  const correlationScore = calculateCorrelation();

  const handleExport = () => {
    const csvRows = [
      ['Timestamp', 'Water Temperature (C)', 'pH Level', 'Turbidity (%)'],
      ...sensorData.map(r => [r.time, r.temp ?? '', r.ph ?? '', r.turbidity ?? ''])
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pond_sensor_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stat = (arr, key) => {
    const vals = arr.map(r => r[key]).filter(v => v != null);
    if (!vals.length) return { min: '—', max: '—', avg: '—' };
    const min = Math.min(...vals), max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2) };
  };

  const tempStat = stat(sensorData, 'temp');
  const phStat   = stat(sensorData, 'ph');
  const turbStat = stat(sensorData, 'turbidity');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="gradient-text glow-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Sensor Analytics & Metrics</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Compare historical parameters, run correlation diagnostics, and export records</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={hours} onChange={e => setHours(Number(e.target.value))} style={{ padding: '8px 32px 8px 12px', fontSize: 13 }}>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={72}>Last 3 Days</option>
            <option value={168}>Last 7 Days</option>
          </select>
          <button className="btn-secondary" onClick={handleExport} disabled={loading}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Summary row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatBox title="Water Temp Trend" min={tempStat.min} max={tempStat.max} avg={tempStat.avg} color="#f59e0b" />
        <StatBox title="pH Levels Range" min={phStat.min} max={phStat.max} avg={phStat.avg} color="#3b82f6" />
        <StatBox title="Turbidity Index" min={turbStat.min} max={turbStat.max} avg={turbStat.avg} color="#8b5cf6" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 28 }}>
        
        {/* main interactive area chart */}
        <div className="card-premium">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Water Quality Parameter Analysis</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Toggle series below to filter graph representation.</div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Custom Legend buttons */}
              <button
                className="btn-secondary"
                onClick={() => setActiveSeries(prev => ({ ...prev, temp: !prev.temp }))}
                style={{
                  background: activeSeries.temp ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  borderColor: activeSeries.temp ? '#f59e0b' : 'var(--border-color)',
                  color: activeSeries.temp ? '#f59e0b' : 'var(--text-muted)'
                }}
              >
                <Thermometer size={13} /> Water Temp
              </button>
              <button
                className="btn-secondary"
                onClick={() => setActiveSeries(prev => ({ ...prev, ph: !prev.ph }))}
                style={{
                  background: activeSeries.ph ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                  borderColor: activeSeries.ph ? '#3b82f6' : 'var(--border-color)',
                  color: activeSeries.ph ? '#3b82f6' : 'var(--text-muted)'
                }}
              >
                <Layers size={13} /> pH
              </button>
              <button
                className="btn-secondary"
                onClick={() => setActiveSeries(prev => ({ ...prev, turbidity: !prev.turbidity }))}
                style={{
                  background: activeSeries.turbidity ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                  borderColor: activeSeries.turbidity ? '#8b5cf6' : 'var(--border-color)',
                  color: activeSeries.turbidity ? '#8b5cf6' : 'var(--text-muted)'
                }}
              >
                <Percent size={13} /> Turbidity
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 10 }}>
                <div className="skeleton" style={{ flex: 1, width: '100%' }} />
                <div style={{ display: 'flex', gap: 20 }}>
                  <div className="skeleton" style={{ height: 12, width: 80 }} />
                  <div className="skeleton" style={{ height: 12, width: 80 }} />
                  <div className="skeleton" style={{ height: 12, width: 80 }} />
                </div>
              </div>
            ) : sensorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} interval="preserveStart" stroke="var(--border-color)" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" />
                  <Tooltip content={<ChartTooltip />} />
                  {activeSeries.temp && (
                    <Line yAxisId="left" type="monotone" dataKey="temp" name="Water Temp (°C)" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  )}
                  {activeSeries.ph && (
                    <Line yAxisId="right" type="monotone" dataKey="ph" name="pH level" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  )}
                  {activeSeries.turbidity && (
                    <Line yAxisId="left" type="monotone" dataKey="turbidity" name="Turbidity (%)" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state-card" style={{ height: '100%', border: 'none', background: 'transparent' }}>
                <div className="empty-state-icon">
                  <Layers size={20} />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
                  No Time-Series Telemetry
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 320, lineHeight: 1.5 }}>
                  Select a wider history scope or check connection to sync real-time metrics logs.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dual column comparison charts */}
        <div className="dashboard-details-grid">
          
          {/* Air vs Water Temp comparison */}
          <div className="card-premium">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Air Temperature vs Water Temperature</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Pearson Correlation: <strong style={{ color: 'var(--color-blue)' }}>{correlationScore}</strong></div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setCompareMode(!compareMode)}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                {compareMode ? 'Split View' : 'Overlay Mode'}
              </button>
            </div>

            <div style={{ width: '100%', height: 200 }}>
              {loading ? (
                <div className="skeleton" style={{ height: '100%', width: '100%' }} />
              ) : sensorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorData.map((d, idx) => ({
                    ...d,
                    air_temp: weatherData[idx]?.air_temp
                  }))}>
                    <defs>
                      <linearGradient id="waterTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="airTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="temp" name="Water Temp" stroke="#f59e0b" fill="url(#waterTemp)" strokeWidth={1.5} dot={false} />
                    {compareMode && (
                      <Area type="monotone" dataKey="air_temp" name="Air Temp" stroke="#06b6d4" fill="url(#airTemp)" strokeWidth={1.5} dot={false} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state-card" style={{ height: '100%', border: 'none', background: 'transparent', padding: 0 }}>
                  <div className="empty-state-icon" style={{ width: 36, height: 36, marginBottom: 8 }}><Layers size={16} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>No overlay data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Environmental Weather parameters */}
          <div className="card-premium">
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Weather Dynamics (Wind & Humidity)
            </div>

            <div style={{ width: '100%', height: 200 }}>
              {loading ? (
                <div className="skeleton" style={{ height: '100%', width: '100%' }} />
              ) : weatherData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weatherData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                    <YAxis yAxisId="l" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar yAxisId="l" dataKey="wind" name="Wind (km/h)" fill="var(--color-blue)" radius={[4,4,0,0]} />
                    <Bar yAxisId="r" dataKey="humidity" name="Humidity (%)" fill="var(--color-emerald)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state-card" style={{ height: '100%', border: 'none', background: 'transparent', padding: 0 }}>
                  <div className="empty-state-icon" style={{ width: 36, height: 36, marginBottom: 8 }}><Layers size={16} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>No weather records found</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
