import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { Sparkles, RefreshCw, Brain, Sliders, Award, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import DataTable from '../components/DataTable';

const safeFormatDate = (v, fmt = 'MM/dd/yyyy HH:mm:ss') => {
  if (!v) return '—';
  try {
    const d = new Date(typeof v === 'string' ? v.replace(' ', 'T') : v);
    return isNaN(d.getTime()) ? '—' : format(d, fmt);
  } catch {
    return '—';
  }
};

const COLS = [
  { key: 'timestamp',   label: 'TIME',        render: v => safeFormatDate(v) },
  { key: 'feature',     label: 'FEATURE',     render: v => v ?? '—' },
  { key: 'importance',  label: 'IMPORTANCE',  render: v => v != null ? Number(v).toFixed(4) : '—' },
  { key: 'direction',   label: 'DIRECTION',   render: v => {
    if (!v) return '—';
    const isPos = v === 'positive';
    return (
      <span className={isPos ? 'status-badge badge-good' : 'status-badge badge-critical'} style={{ fontSize: 10, padding: '2px 8px' }}>
        {v.toUpperCase()}
      </span>
    );
  }},
  { key: 'explanation', label: 'EXPLANATION', sortable: false,
    render: v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v ?? '—'}</span> },
];

export default function XAIPredictions() {
  const [xaiData,  setXaiData]  = useState([]);
  const [predData, setPredData] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastUpd,  setLastUpd]  = useState('');
  const [error,    setError]    = useState(null);

  // Playground simulation states
  const [simPh, setSimPh] = useState(7.0);
  const [simTemp, setSimTemp] = useState(28.0);
  const [simTurb, setSimTurb] = useState(15.0);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [xai, pred] = await Promise.all([
        api.getXAI(24).catch(() => []),
        api.getPredictions(24).catch(() => []),
      ]);
      setXaiData(Array.isArray(xai)  ? xai  : xai?.data  ?? []);
      setPredData(Array.isArray(pred) ? pred : pred?.data ?? []);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);


  /* Run simulated prediction */
  const runSimulation = async () => {
    setSimLoading(true);
    setError(null);
    try {
      const res = await api.predictManual({
        ph: Number(simPh),
        temperature: Number(simTemp),
        turbidity: Number(simTurb)
      });
      setSimResult(res);
      setFlashSuccess(true);
      setTimeout(() => setFlashSuccess(false), 1200);
      // Reload logs to show new predictions in list
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSimLoading(false);
    }
  };

  /* latest prediction details */
  const latest = simResult ?? predData[0];

  // Animate the confidence score counter
  useEffect(() => {
    if (!latest) return;
    const targetConf = Math.round((latest.confidence ?? latest.confidence_score ?? 0.8) * 100);
    let start = 0;
    setAnimatedConfidence(0);
    
    const duration = 600;
    const stepTime = Math.max(Math.floor(duration / targetConf), 6);
    
    const timer = setInterval(() => {
      start += 1;
      setAnimatedConfidence(start);
      if (start >= targetConf) {
        clearInterval(timer);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [latest]);

  /* Aggregate feature importances */
  const featureImportance = xaiData.reduce((acc, row) => {
    if (!row.feature) return acc;
    if (!acc[row.feature]) acc[row.feature] = { feature: row.feature, total: 0, count: 0 };
    acc[row.feature].total += Math.abs(Number(row.importance ?? 0));
    acc[row.feature].count += 1;
    return acc;
  }, {});
  
  const globalImportanceData = Object.values(featureImportance)
    .map(r => ({ feature: r.feature, importance: +(r.total / r.count).toFixed(4) }))
    .sort((a, b) => b.importance - a.importance);



  /* Construct SHAP Waterfall data for the latest prediction */
  const localShapData = () => {
    if (!latest?.xai_explanation) {
      // Fallback/mock values for visual presentation if empty
      return [
        { name: 'pH Level', shap: 0.125, color: 'var(--color-emerald)' },
        { name: 'Water Temp', shap: -0.045, color: 'var(--color-rose)' },
        { name: 'Turbidity', shap: 0.218, color: 'var(--color-emerald)' }
      ];
    }
    
    // Check if xai_explanation contains feature_importance sub-object
    const fiObj = latest.xai_explanation.feature_importance || latest.xai_explanation;
    
    return Object.entries(fiObj)
      .filter(([feat]) => ['ph', 'temperature', 'turbidity'].includes(feat))
      .map(([feat, val]) => {
        const importanceValue = Number(val || 0);
        return {
          name: feat === 'ph' ? 'pH Level' : feat === 'temperature' ? 'Water Temp' : 'Turbidity',
          shap: +importanceValue.toFixed(4),
          color: importanceValue >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)'
        };
      });
  };

  const shapWaterfall = localShapData();

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="gradient-text glow-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} color="var(--color-violet)" /> XAI Predictions Hub
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Explore local SHAP attributions, check model confidence layers, and simulate scenario predictions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpd && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <span className="pulse-dot" />
              <span>Synced {lastUpd}</span>
            </div>
          )}
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 12, padding: '14px 18px',
          color: 'var(--color-rose)', fontSize: 13, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Top section: Simulation Playground & Model confidence */}
      <div className="dashboard-details-grid" style={{ marginBottom: 28 }}>
        
        {/* Scenario Playground Simulator */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Sliders size={18} color="var(--color-blue)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>XAI Simulation Playground</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* pH Slider */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                pH level: <span style={{ color: 'var(--color-blue)', fontFamily: 'JetBrains Mono' }}>{simPh}</span>
              </label>
              <input
                type="range" min="4.0" max="10.0" step="0.1" value={simPh}
                onChange={e => setSimPh(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--color-blue)' }}
              />
            </div>
            
            {/* Temp Slider */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Water Temp: <span style={{ color: 'var(--color-amber)', fontFamily: 'JetBrains Mono' }}>{simTemp} °C</span>
              </label>
              <input
                type="range" min="15.0" max="40.0" step="0.5" value={simTemp}
                onChange={e => setSimTemp(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--color-amber)' }}
              />
            </div>

            {/* Turbidity Slider */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Turbidity: <span style={{ color: 'var(--color-violet)', fontFamily: 'JetBrains Mono' }}>{simTurb} %</span>
              </label>
              <input
                type="range" min="0" max="100" step="1" value={simTurb}
                onChange={e => setSimTurb(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--color-violet)' }}
              />
            </div>
          </div>

          <button className="btn-premium" onClick={runSimulation} disabled={simLoading} style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
            <RefreshCw size={14} className={simLoading ? 'animate-spin' : ''} />
            <span>{simLoading ? 'Running Inference...' : 'Run Simulation Inference'}</span>
          </button>
        </div>

        {/* Prediction Results & Confidence Gauge */}
        <div 
          className={`card-premium ${flashSuccess ? 'sensor-glow' : ''}`} 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            borderLeft: '4px solid var(--color-blue)',
            transition: 'box-shadow 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Award size={18} color="var(--color-blue)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Inference Output Diagnostics</span>
          </div>

          {latest ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 16, alignItems: 'center', flex: 1 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Species</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-blue)', marginTop: 4, textTransform: 'capitalize' }}>
                  {latest.recommended_fish ?? latest.prediction ?? '—'}
                </div>
                
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>WATER STATUS</div>
                    <span className={`status-badge ${latest.water_quality === 'GOOD' ? 'badge-good' : 'badge-warning'}`} style={{ marginTop: 4 }}>
                      {latest.water_quality ?? latest.habitat_status ?? 'NORMAL'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE MODEL</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginTop: 6, fontFamily: 'JetBrains Mono' }}>
                      Random Forest (rf)
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Circle */}
              <div style={{ position: 'relative', width: 120, height: 120, justifySelf: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-color)" strokeWidth="3" style={{ opacity: 0.3 }} />
                  <circle
                    cx="18" cy="18" r="15.915" fill="none"
                    stroke="var(--color-blue)"
                    strokeWidth="3.2"
                    strokeDasharray={`${animatedConfidence} 100`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.1s linear' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {animatedConfidence}%
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)' }}>CONF</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Select simulated values and run inference
            </div>
          )}
        </div>
      </div>

      {/* SHAP Visualizations */}
      <div className="dashboard-details-grid" style={{ marginBottom: 28 }}>
        
        {/* Waterfall Contribution Chart */}
        <div className="card-premium">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Brain size={16} color="var(--color-violet)" />
              <span>Local SHAP Attribution (Waterfall Plot)</span>
            </div>
            {/* SHAP impact legend */}
            <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-emerald)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Positive Impact</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-rose)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Negative Impact</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapWaterfall} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={100} stroke="var(--border-color)" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const val = payload[0].value;
                    return (
                      <div style={{
                        background: 'rgba(7, 10, 19, 0.9)', border: '1px solid var(--border-color)',
                        borderRadius: 8, padding: '6px 12px', fontSize: 11
                      }}>
                        Shapley Value: <strong style={{ color: val >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>{val.toFixed(4)}</strong>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={0} stroke="var(--border-color)" strokeWidth={1.5} />
                <Bar dataKey="shap" fill="var(--color-blue)" radius={[0, 4, 4, 0]}>
                  {shapWaterfall.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Feature Importance */}
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            <Brain size={16} color="var(--color-cyan)" />
            <span>Global Mean Feature Importance (SHAP values)</span>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            {globalImportanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalImportanceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={100} stroke="var(--border-color)" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', fontSize: 11 }}>
                          Importance: <strong>{payload[0].value.toFixed(4)}</strong>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="importance" fill="var(--color-violet)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state-card" style={{ border: 'none', background: 'transparent' }}>
                <div className="empty-state-icon"><Brain size={20} /></div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>No SHAP Records Found</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Run a prediction to generate feature importance data.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          AI Attribution Log Table
        </div>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 2fr', gap: 12, padding: '8px 0' }}>
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
              </div>
            ))}
          </div>
        ) : (
          <DataTable columns={COLS} data={xaiData} />
        )}
      </div>

    </div>
  );
}
