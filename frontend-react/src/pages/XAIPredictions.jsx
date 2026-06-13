import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { format } from 'date-fns';
import { Sparkles, RefreshCw, Brain, Zap } from 'lucide-react';
import { api } from '../services/api';
import DataTable from '../components/DataTable';

const COLORS = ['#58a6ff', '#3fb950', '#f59e0b', '#8b5cf6', '#06b6d4', '#f85149', '#e3b341'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1c2333', border: '1px solid #30363d', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#8b949e', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// prediction history row → table columns
const PRED_COLS = [
  { key: 'timestamp',        label: 'TIME',       render: v => { try { return format(new Date(v), 'MM/dd/yyyy HH:mm:ss'); } catch { return v ?? '—'; } } },
  { key: 'recommended_fish', label: 'FISH',        render: v => <span style={{ color: '#3fb950', fontWeight: 600 }}>{v ?? '—'}</span> },
  { key: 'confidence',       label: 'CONFIDENCE',  render: v => v != null ? `${(v*100).toFixed(1)}%` : '—' },
  { key: 'water_quality',    label: 'WATER QUAL',  render: v => {
    if (!v) return '—';
    const cls = v === 'GOOD' ? 'status-good' : v === 'MODERATE' ? 'status-warning' : 'status-critical';
    return <span className={cls}>{v}</span>;
  }, sortable: false },
  { key: 'habitat_status',   label: 'HABITAT',     render: v => {
    if (!v) return '—';
    const cls = v === 'SUITABLE' ? 'status-good' : v === 'UNSUITABLE' ? 'status-critical' : 'status-warning';
    return <span className={cls}>{v}</span>;
  }, sortable: false },
];

export default function XAIPredictions() {
  const [history,  setHistory]  = useState([]);
  const [latest,   setLatest]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [predicting, setPred]   = useState(false);
  const [lastUpd,  setLastUpd]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, lat] = await Promise.all([
        api.getPredictions(24).catch(() => ({ data: [] })),
        api.getLatestPrediction().catch(() => null),
      ]);
      const arr = Array.isArray(hist) ? hist : (hist?.data ?? []);
      setHistory(arr);
      setLatest(lat?.data ?? arr[0] ?? null);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto predict
  const handleAutoPredict = async () => {
    setPred(true);
    try {
      await api.runAutoPrediction();
      await load(); // reload to show new prediction
    } catch (e) {
      alert('Auto prediction failed: ' + e.message);
    } finally {
      setPred(false);
    }
  };

  // Build SHAP chart from latest xai_explanation
  const xai = latest?.xai_explanation ?? {};
  const shapData = Object.entries(xai)
    .filter(([, v]) => typeof v === 'number')
    .map(([feature, value]) => ({ feature, value: Math.abs(value), raw: value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Fish frequency from history
  const fishFreq = history.reduce((acc, r) => {
    if (r.recommended_fish) acc[r.recommended_fish] = (acc[r.recommended_fish] ?? 0) + 1;
    return acc;
  }, {});
  const fishBar = Object.entries(fishFreq)
    .map(([fish, count]) => ({ fish, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={22} color="#8b5cf6" /> XAI Predictions
          </h1>
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>
            Explainable AI fish suitability predictions with SHAP analysis
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpd && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
              <span className="pulse-dot" /><span>{lastUpd}</span>
            </div>
          )}
          <button
            className="btn-primary"
            onClick={handleAutoPredict}
            disabled={predicting || loading}
            style={{ gap: 6 }}
          >
            <Zap size={13} /> {predicting ? 'Predicting…' : 'Run Auto Predict'}
          </button>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Recommended Fish', value: latest?.recommended_fish ?? '—',                         color: '#3fb950' },
          { label: 'Confidence',       value: latest?.confidence != null ? `${(latest.confidence*100).toFixed(1)}%` : '—', color: '#3b82f6' },
          { label: 'Water Quality',    value: latest?.water_quality ?? '—',                             color: '#f59e0b' },
          { label: 'Habitat Status',   value: latest?.habitat_status ?? '—',                            color: '#8b5cf6' },
          { label: 'Predictions (24h)',value: history.length,                                           color: '#06b6d4' },
          { label: 'Fish Species',     value: Object.keys(fishFreq).length,                             color: '#e3b341' },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, letterSpacing: '-0.02em' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* SHAP explanation chart */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
            <Brain size={16} color="#8b5cf6" /> SHAP Feature Importance (latest)
          </div>
          {shapData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8b949e' }} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#8b949e' }} width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="|SHAP|" radius={[0,4,4,0]}>
                  {shapData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13, flexDirection: 'column', gap: 12 }}>
              {loading ? 'Loading…' : (
                <>
                  <span>No SHAP data yet</span>
                  <button className="btn-primary" onClick={handleAutoPredict} disabled={predicting}>
                    <Zap size={13} /> {predicting ? 'Predicting…' : 'Run First Prediction'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fish frequency */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
            Fish Prediction Frequency (24h)
          </div>
          {fishBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fishBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="fish" tick={{ fontSize: 11, fill: '#8b949e' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Count" radius={[4,4,0,0]}>
                  {fishBar.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No predictions yet'}
            </div>
          )}
        </div>

        {/* Latest features used */}
        {latest?.features_used && (
          <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
              Features Used (latest prediction)
            </div>
            {Object.entries(latest.features_used).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid #21262d',
                fontSize: 13,
              }}>
                <span style={{ color: '#8b949e', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                <span style={{ color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace' }}>
                  {typeof v === 'number' ? v.toFixed(2) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Top 3 fish */}
        {latest?.top3_fish && (
          <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
              Top 3 Suitable Fish (latest)
            </div>
            {latest.top3_fish.map((item, i) => {
              const fish = typeof item === 'string' ? item : item.fish ?? item.name ?? JSON.stringify(item);
              const prob = typeof item === 'object' ? (item.probability ?? item.confidence ?? null) : null;
              const pct  = prob != null ? (prob * 100).toFixed(1) : null;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: '#e6edf3', fontWeight: 600 }}>#{i+1} {fish}</span>
                    {pct && <span style={{ color: COLORS[i], fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{pct}%</span>}
                  </div>
                  {pct && (
                    <div style={{ background: '#21262d', borderRadius: 4, height: 6 }}>
                      <div style={{ background: COLORS[i], borderRadius: 4, height: '100%', width: `${pct}%`, transition: 'width 0.4s' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Prediction history table */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>
          Prediction History (24h) — {history.length} records
        </div>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>Loading…</div>
        ) : (
          <DataTable columns={PRED_COLS} data={history} />
        )}
      </div>
    </div>
  );
}
