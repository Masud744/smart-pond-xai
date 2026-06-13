import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { api } from '../services/api';

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

function ChartCard({ title, children, fullWidth }) {
  return (
    <div style={{
      background: '#161b22', border: '1px solid #21262d',
      borderRadius: 12, padding: 20,
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

function StatCard({ label, min, max, avg, color }) {
  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '14px 20px' }}>
      <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 20 }}>
        {[['MIN', min], ['MAX', max], ['AVG', avg]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 10, color: '#8b949e', fontWeight: 600 }}>{k}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calcStats(arr, key) {
  const vals = arr.map(r => r[key]).filter(v => v != null && !isNaN(v));
  if (!vals.length) return { min: '—', max: '—', avg: '—' };
  const min = Math.min(...vals), max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2) };
}

export default function Analytics() {
  const [sensorData,  setSensorData]  = useState([]);
  const [weatherSnap, setWeatherSnap] = useState(null);
  const [hours,       setHours]       = useState(24);
  const [loading,     setLoading]     = useState(true);
  const [lastUpd,     setLastUpd]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, dash] = await Promise.all([
        api.getHistory(hours).catch(() => ({ data: [] })),
        api.getDashboard().catch(() => null),
      ]);
      const arr = Array.isArray(hist) ? hist : (hist?.data ?? []);
      setSensorData(arr);
      setWeatherSnap(dash?.weather ?? null);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  // Prepare chart-ready data (newest → oldest → reverse for chart)
  const chartData = [...sensorData].reverse().slice(-48).map(r => ({
    time:      r.timestamp ? format(new Date(r.timestamp), 'HH:mm') : '',
    temp:      r.temperature != null ? +Number(r.temperature).toFixed(2) : null,
    ph:        r.ph          != null ? +Number(r.ph).toFixed(2)          : null,
    turbidity: r.turbidity   != null ? +Number(r.turbidity).toFixed(1)   : null,
  }));

  const tempStat = calcStats(chartData, 'temp');
  const phStat   = calcStats(chartData, 'ph');
  const turbStat = calcStats(chartData, 'turbidity');

  // Status distribution
  const statusCounts = sensorData.reduce((acc, r) => {
    const s = r.status ?? 'UNKNOWN';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const statusBar = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const noData = chartData.length === 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>Sensor trends and statistical analysis</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={hours} onChange={e => setHours(Number(e.target.value))}
            style={{ padding: '7px 28px 7px 12px', fontSize: 13 }}>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={72}>Last 3 days</option>
            <option value={168}>Last 7 days</option>
          </select>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
          {lastUpd && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
              <span className="pulse-dot" /><span>{lastUpd}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Temperature (°C)" color="#f59e0b" {...tempStat} />
        <StatCard label="pH Level"          color="#3b82f6" {...phStat}   />
        <StatCard label="Turbidity (%)"     color="#8b5cf6" {...turbStat} />
        {weatherSnap && (
          <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '14px 20px' }}>
            <div style={{ fontSize: 12, color: '#06b6d4', fontWeight: 600, marginBottom: 10 }}>Current Weather</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['Air', `${weatherSnap.air_temp ?? '—'}°C`],
                ['Hum', `${weatherSnap.humidity ?? '—'}%`],
                ['Wind', `${weatherSnap.wind_speed ?? '—'}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: '#8b949e', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Temperature area chart — full width */}
        <ChartCard title="Temperature Trend" fullWidth>
          {noData ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b949e' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} domain={['auto','auto']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f59e0b" fill="url(#tGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* pH chart */}
        <ChartCard title="pH Level Trend">
          {noData ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b949e' }} interval="preserveStartEnd" />
                <YAxis domain={['auto','auto']} tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="ph" name="pH Level" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Turbidity chart */}
        <ChartCard title="Turbidity Trend">
          {noData ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8b949e' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="turbidity" name="Turbidity (%)" stroke="#8b5cf6" fill="url(#turbGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Status distribution */}
        <ChartCard title="Water Status Distribution">
          {statusBar.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8b949e' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4,4,0,0]}
                  fill="#3fb950"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
