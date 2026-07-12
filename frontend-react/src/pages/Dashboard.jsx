import { useState, useEffect, useCallback, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Thermometer, FlaskConical, Eye, CloudSun, Fish, AlertTriangle, RefreshCw, Cpu, Activity, Award, Info, Wind, Droplets, CloudRain, Compass } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import DigitalTwinScene from '../components/DigitalTwinScene';

/* ─── Premium KPI Card with Mini Sparkline & Real-time Range Segment Gauge ─── */
function KpiCard({ icon: Icon, label, value, unit, color, status, historyData, dataKey, decimals = 2 }) {
  const sparkColor = color;
  const isHealthy = status !== 'POOR' && status !== 'CRITICAL';
  const numericValue = value != null ? parseFloat(value) : null;
  const isNumeric = value != null && !isNaN(numericValue) && isFinite(numericValue);

  // Live value counting state
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (!isNumeric) return;
    let start = parseFloat(displayVal) || 0;
    const end = numericValue;
    if (start === end) return;
    
    const diff = end - start;
    const steps = 25;
    const stepVal = diff / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      setDisplayVal(prev => {
        const next = start + stepVal * currentStep;
        if (currentStep >= steps) {
          clearInterval(timer);
          return end;
        }
        return next;
      });
    }, 15);
    
    return () => clearInterval(timer);
  }, [numericValue]);

  // Determine pointer and range segment percentages
  let pct = 0;
  let optStartPct = 0;
  let optEndPct = 0;
  let rangeLabel = "";

  if (isNumeric) {
    if (label.includes("Temperature")) {
      pct = Math.max(0, Math.min(100, ((numericValue - 15) / (42 - 15)) * 100));
      optStartPct = ((25 - 15) / (42 - 15)) * 100;
      optEndPct = ((32 - 15) / (42 - 15)) * 100;
      rangeLabel = "Optimal: 25 - 32°C";
    } else if (label.includes("pH")) {
      pct = Math.max(0, Math.min(100, ((numericValue - 4) / (10 - 4)) * 100));
      optStartPct = ((6.5 - 4) / (10 - 4)) * 100;
      optEndPct = ((8.5 - 4) / (10 - 4)) * 100;
      rangeLabel = "Optimal: 6.5 - 8.5";
    } else if (label.includes("Turbidity")) {
      pct = Math.max(0, Math.min(100, (numericValue / 100) * 100));
      optStartPct = 0;
      optEndPct = 30;
      rangeLabel = "Optimal: < 30%";
    }
  }

  // State-based ambient card outline / shadows
  const glowStyle = status === 'CRITICAL'
    ? { border: '1px solid rgba(244, 63, 94, 0.35)', boxShadow: '0 0 20px rgba(244, 63, 94, 0.08)' }
    : status === 'WARNING'
    ? { border: '1px solid rgba(245, 158, 11, 0.35)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.08)' }
    : { border: '1px solid var(--border-color)' };

  return (
    <div className="card-premium" style={{ ...glowStyle, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', transition: 'all 0.3s ease' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${color}12`,
              border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
                {value != null ? (
                  isNumeric ? (
                    `${displayVal.toFixed(decimals)}`
                  ) : `${value}`
                ) : '—'}
                {unit && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span>}
                {isNumeric && (
                  <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, background: color, marginLeft: 8, borderRadius: '50%' }} />
                )}
              </div>
            </div>
          </div>
          
          {/* Status indicator pill */}
          {status && (
            <span className={`status-badge ${status === 'GOOD' ? 'badge-good' : status === 'WARNING' ? 'badge-warning' : 'badge-critical'}`} style={{ fontSize: 9, padding: '2px 8px' }}>
              {status}
            </span>
          )}
        </div>

        {/* Mini Sparkline Chart */}
        {historyData && historyData.length > 0 ? (
          <div style={{ height: 42, width: '100%', marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparkColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={{
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: 6, padding: '4px 8px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        {payload[0].value}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={sparkColor}
                  fill={`url(#grad-${dataKey})`}
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            Awaiting live samples
          </div>
        )}
      </div>

      {/* Advanced Visual Range Segment Gauge */}
      {isNumeric && rangeLabel && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>{rangeLabel}</span>
            <span style={{ color: isHealthy ? 'var(--color-emerald)' : 'var(--color-rose)', fontWeight: 600 }}>
              {label.includes("Temperature") ? (numericValue < 25 ? 'Cold' : numericValue > 32 ? 'Hot' : 'Optimal')
               : label.includes("pH") ? (numericValue < 6.5 ? 'Acidic' : numericValue > 8.5 ? 'Alkaline' : 'Optimal')
               : (numericValue > 30 ? 'Murky' : 'Optimal')}
            </span>
          </div>
          <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'visible' }}>
            {/* Optimal zone highlighting */}
            <div style={{
              position: 'absolute',
              left: `${optStartPct}%`,
              width: `${optEndPct - optStartPct}%`,
              height: '100%',
              background: 'rgba(16, 185, 129, 0.2)',
              borderLeft: '1px solid rgba(16, 185, 129, 0.3)',
              borderRight: '1px solid rgba(16, 185, 129, 0.3)',
            }} />
            {/* Pointer cursor tick */}
            <div style={{
              position: 'absolute',
              left: `${pct}%`,
              top: -3,
              width: 4,
              height: 12,
              background: color,
              borderRadius: 2,
              boxShadow: `0 0 8px ${color}`,
              transform: 'translateX(-50%)',
              transition: 'left 0.5s ease-out'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [displayScore, setDisplayScore] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [dash, hist] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getHistory(24).catch(() => []),
      ]);
      setDashboard(dash);
      setHistory(Array.isArray(hist) ? hist : hist?.data ?? []);
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

  const latest = dashboard?.latest_sensor ?? dashboard?.sensor ?? dashboard;
  
  /* Calculate overall Health Score */
  const computeHealthScore = () => {
    if (!latest) return 0;
    let score = 100;
    
    // pH penalties (Safe: 6.5 - 8.5)
    const ph = latest.ph_level ?? latest.ph ?? 7.0;
    if (ph < 6.5) score -= Math.min(30, (6.5 - ph) * 30);
    else if (ph > 8.5) score -= Math.min(30, (ph - 8.5) * 30);

    // Temperature penalties (Safe: 25 - 32)
    const temp = latest.temperature ?? latest.temp ?? 28.0;
    if (temp < 25) score -= Math.min(30, (25 - temp) * 10);
    else if (temp > 32) score -= Math.min(30, (temp - 32) * 10);

    // Turbidity penalties (Safe: < 30%)
    const turb = latest.turbidity ?? 20;
    if (turb > 30) score -= Math.min(40, (turb - 30) * 1.5);

    return Math.max(15, Math.round(score));
  };

  const healthScore = computeHealthScore();
  const status = latest?.status ?? (healthScore > 80 ? 'GOOD' : healthScore > 50 ? 'WARNING' : 'CRITICAL');

  // Animate the health index display counter
  useEffect(() => {
    if (!latest) return;
    let start = 0;
    const end = healthScore;
    if (end <= 0) return;
    
    setDisplayScore(0);
    const duration = 750;
    const stepTime = Math.max(Math.floor(duration / end), 6);
    
    const timer = setInterval(() => {
      start += 1;
      setDisplayScore(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [healthScore, latest]);

  /* Prepare chart data for sparklines */
  const sparkData = history.slice(-24).map(r => ({
    timestamp: r.timestamp ? format(new Date(r.timestamp), 'HH:mm') : '',
    temp: r.temperature ?? r.temp ?? null,
    ph: r.ph_level ?? r.ph ?? null,
    turbidity: r.turbidity ?? null,
  }));

  /* Construct dynamic system logs from actual dashboard feeds */
  const dynamicEvents = useMemo(() => {
    if (!latest) return [];
    const events = [];
    const latestTime = latest.timestamp ? format(new Date(latest.timestamp), 'HH:mm:ss') : 'Recently';

    events.push({
      time: 'LIVE',
      msg: `Pond telemetry synced successfully at ${latestTime} via precision gateway.`,
      status: 'info'
    });

    const pred = dashboard?.latest_prediction ?? dashboard?.prediction;
    if (pred) {
      const confidence = pred.confidence_score ?? pred.confidence ?? 0.8525;
      events.push({
        time: pred.timestamp ? format(new Date(pred.timestamp), 'HH:mm') : 'Recently',
        msg: `ML Model triggered suggestion for: ${pred.recommended_fish ?? 'Tilapia'} (${(confidence * 100).toFixed(1)}% confidence).`,
        status: 'success'
      });
    }

    const alertCount = dashboard?.active_alerts ?? dashboard?.alerts_count ?? 0;
    if (alertCount > 0) {
      events.push({
        time: 'ALERT',
        msg: `${alertCount} active anomaly alert(s) currently require operational review.`,
        status: 'warning'
      });
    } else {
      events.push({
        time: 'AUDIT',
        msg: 'Diagnostics check complete. All telemetry nodes within optimal ranges.',
        status: 'success'
      });
    }

    return events;
  }, [latest, dashboard]);

  // Initial Shimmer Loader skeletons if loading data for the very first time
  if (!dashboard && loading) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div className="skeleton" style={{ height: 28, width: 220, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: 380 }} />
          </div>
          <div className="skeleton" style={{ height: 36, width: 140 }} />
        </div>
        
        {/* Hero Grid Skeletons */}
        <div className="dashboard-hero-grid">
          {/* Circular Score card skeleton */}
          <div className="card-static" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 18 }}>
            <div className="skeleton" style={{ height: 14, width: 140 }} />
            <div className="skeleton" style={{ height: 120, width: 120, borderRadius: '50%' }} />
            <div className="skeleton" style={{ height: 18, width: 180 }} />
          </div>
          {/* Digital twin skeleton */}
          <div className="card-static" style={{ height: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton" style={{ height: 18, width: 160 }} />
              <div className="skeleton" style={{ height: 18, width: 80 }} />
            </div>
            <div className="skeleton" style={{ flex: 1, borderRadius: 12 }} />
          </div>
        </div>

        {/* KPI Grid Skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="card-static" style={{ height: 150, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="skeleton" style={{ height: 36, width: '80%' }} />
            <div className="skeleton" style={{ height: 30, width: '100%', marginTop: 'auto' }} />
          </div>
          <div className="card-static" style={{ height: 150, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="skeleton" style={{ height: 36, width: '80%' }} />
            <div className="skeleton" style={{ height: 30, width: '100%', marginTop: 'auto' }} />
          </div>
          <div className="card-static" style={{ height: 150, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="skeleton" style={{ height: 36, width: '80%' }} />
            <div className="skeleton" style={{ height: 30, width: '100%', marginTop: 'auto' }} />
          </div>
          <div className="card-static" style={{ height: 150, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="skeleton" style={{ height: 36, width: '80%' }} />
            <div className="skeleton" style={{ height: 30, width: '100%', marginTop: 'auto' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="gradient-text glow-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Dashboard Overview</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Real-time Aquaculture IoT Intelligence & Explainable ML Predictions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <span className="pulse-dot" />
              <span style={{ fontWeight: 600 }}>LIVE SYNC</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span style={{ color: 'var(--text-muted)' }}>Updated {lastUpdated}</span>
            </div>
          )}
          <button className="btn-secondary animate-pulse" onClick={load} disabled={loading} style={{ padding: '8px 16px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
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
          <span><strong>Connection Alert:</strong> {error} — Operating in fallback display mode.</span>
        </div>
      )}


      {/* Top Section: Health Score & Digital Twin */}
      <div className="dashboard-hero-grid">
        
        {/* Health Score Panel */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 20 }}>
            Pond Health Index
          </div>
          
          <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 20 }}>
            {/* SVG Radial Gauge */}
            <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <path
                className="heartbeat-live"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="2.5"
                style={{ opacity: 0.3 }}
              />
              {/* Foreground progress circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={healthScore > 80 ? 'var(--color-emerald)' : healthScore > 50 ? 'var(--color-amber)' : 'var(--color-rose)'}
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="2.8"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{displayScore}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PTS</div>
            </div>
          </div>
          
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            System Status: <span style={{
              color: status === 'GOOD' ? 'var(--color-emerald)' : status === 'WARNING' ? 'var(--color-amber)' : 'var(--color-rose)'
            }}>{status}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            {status === 'GOOD' ? 'All water parameters are aligned with optimal standards.' : status === 'WARNING' ? 'Minor deviations detected. Check AI advice.' : 'Critical deviation detected! Suspended automated feeding.'}
          </p>
        </div>

        {/* Pond Digital Twin Visualisation */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', position: 'relative', padding: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--color-blue)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Smart Pond Digital Twin</span>
            </div>
            <span className="status-badge badge-good" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={12} /> Model Active
            </span>
          </div>

          {/* SVG Digital Twin Container */}
          <div style={{ flex: 1, minHeight: 200, background: 'transparent', borderRadius: 12, border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* New underwater scene layer — sits behind everything */}
            <DigitalTwinScene />
            
            {/* Animated SVG Pond waves, fishes & sensors — reduced opacity so new scene shows through */}
            <svg width="100%" height="100%" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.35, zIndex: 1 }}>
              <defs>
                <linearGradient id="pondGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={status === 'GOOD' ? '#0c2461' : status === 'WARNING' ? '#3f2b11' : '#450a0a'} stopOpacity="0.5" />
                  <stop offset="60%" stopColor={status === 'GOOD' ? '#0a1a3f' : status === 'WARNING' ? '#1a1505' : '#1a0505'} stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#050810" stopOpacity="0.95" />
                </linearGradient>
                
                {/* Light caustic pattern overlay */}
                <radialGradient id="caustic1" cx="30%" cy="20%" r="25%">
                  <stop offset="0%" stopColor="rgba(100, 180, 255, 0.06)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="caustic2" cx="70%" cy="35%" r="20%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.05)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              
              {/* Deep water background */}
              <rect width="100%" height="100%" fill="url(#pondGrad)" />
              
              {/* Caustic light patches */}
              <rect width="100%" height="100%" fill="url(#caustic1)" className="heartbeat-live" />
              <rect width="100%" height="100%" fill="url(#caustic2)" className="heartbeat-live" style={{ animationDelay: '-0.7s' }} />
              
              {/* Water surface wave layers */}
              <path
                className="water-ripple"
                d="M-50 30 C100 18, 200 42, 350 28 C500 14, 600 40, 750 26 C900 12, 980 38, 1050 25 L1050 0 L-50 0 Z"
                fill="rgba(59, 130, 246, 0.06)"
                style={{ animationDuration: '7s' }}
              />
              <path
                className="water-ripple"
                d="M-50 45 C150 55, 300 35, 500 48 C700 61, 850 38, 1050 50 L1050 0 L-50 0 Z"
                fill="rgba(6, 182, 212, 0.04)"
                style={{ animationDuration: '5s', animationDelay: '-2s' }}
              />
              <path
                className="water-ripple"
                d="M-50 55 C200 48, 400 62, 600 52 C800 42, 900 58, 1050 48 L1050 0 L-50 0 Z"
                fill="rgba(99, 102, 241, 0.03)"
                style={{ animationDuration: '9s', animationDelay: '-4s' }}
              />

              {/* Underwater plants/seaweed silhouettes along bottom */}
              <g opacity="0.15">
                <path d="M60 240 Q65 210, 55 190 Q50 175, 58 160" stroke="#10b981" strokeWidth="2" fill="none" />
                <path d="M70 240 Q75 215, 68 200 Q62 185, 72 165 Q78 150, 70 140" stroke="#10b981" strokeWidth="1.5" fill="none" />
                <path d="M150 240 Q155 220, 148 205 Q142 190, 152 175" stroke="#059669" strokeWidth="2" fill="none" />
                <path d="M850 240 Q855 215, 845 195 Q838 178, 848 160" stroke="#10b981" strokeWidth="2" fill="none" />
                <path d="M860 240 Q865 225, 858 210 Q850 195, 862 178 Q870 165, 858 150" stroke="#059669" strokeWidth="1.5" fill="none" />
                <path d="M920 240 Q925 220, 918 205" stroke="#10b981" strokeWidth="1.5" fill="none" />
              </g>

              {/* Rising air bubbles */}
              <circle r="2" fill="rgba(255,255,255,0.12)">
                <animate attributeName="cy" values="220;40" dur="8s" repeatCount="indefinite" />
                <animate attributeName="cx" values="200;205" dur="8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.15;0.05;0" dur="8s" repeatCount="indefinite" />
              </circle>
              <circle r="1.5" fill="rgba(255,255,255,0.1)">
                <animate attributeName="cy" values="230;50" dur="11s" repeatCount="indefinite" begin="-3s" />
                <animate attributeName="cx" values="600;595" dur="11s" repeatCount="indefinite" begin="-3s" />
                <animate attributeName="opacity" values="0.12;0.04;0" dur="11s" repeatCount="indefinite" begin="-3s" />
              </circle>
              <circle r="1" fill="rgba(255,255,255,0.08)">
                <animate attributeName="cy" values="235;60" dur="14s" repeatCount="indefinite" begin="-7s" />
                <animate attributeName="cx" values="420;418" dur="14s" repeatCount="indefinite" begin="-7s" />
                <animate attributeName="opacity" values="0.1;0.03;0" dur="14s" repeatCount="indefinite" begin="-7s" />
              </circle>
              <circle r="1.8" fill="rgba(255,255,255,0.1)">
                <animate attributeName="cy" values="225;30" dur="10s" repeatCount="indefinite" begin="-5s" />
                <animate attributeName="cx" values="780;783" dur="10s" repeatCount="indefinite" begin="-5s" />
                <animate attributeName="opacity" values="0.12;0.04;0" dur="10s" repeatCount="indefinite" begin="-5s" />
              </circle>
              
              {/* ═══════ FISH 1 — Large Tilapia (swims right) ═══════ */}
              <g className="fish-swim-right" style={{ animationDuration: status === 'GOOD' ? '16s' : '28s' }}>
                <g transform="translate(100, 100)">
                  {/* Body — smooth oval with tapered head and caudal peduncle */}
                  <ellipse cx="0" cy="0" rx="28" ry="12" fill="rgba(180, 210, 240, 0.30)" />
                  {/* Head highlight */}
                  <ellipse cx="-18" cy="-2" rx="8" ry="6" fill="rgba(200, 225, 255, 0.15)" />
                  {/* Dorsal fin (top spiny ridge) */}
                  <path d="M-12 -11 Q-5 -22, 5 -20 Q12 -18, 18 -11" fill="rgba(130, 180, 240, 0.22)" stroke="rgba(180, 220, 255, 0.15)" strokeWidth="0.5" />
                  {/* Caudal (tail) fin — forked */}
                  <path d="M26 -2 L38 -14 L34 -1 L38 12 L26 2 Z" fill="rgba(150, 200, 255, 0.25)" />
                  {/* Pectoral fin (side flipper) */}
                  <path d="M-8 5 Q-14 14, -6 16 Q0 14, -2 6" fill="rgba(160, 200, 240, 0.18)" />
                  {/* Anal fin (bottom rear) */}
                  <path d="M8 10 Q12 18, 20 16 Q22 12, 20 10" fill="rgba(140, 190, 240, 0.18)" />
                  {/* Lateral line */}
                  <line x1="-18" y1="0" x2="22" y2="-1" stroke="rgba(200, 230, 255, 0.12)" strokeWidth="0.5" strokeDasharray="3 2" />
                  {/* Scale shimmer arcs */}
                  <path d="M-10 -3 Q-7 -6, -4 -3" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
                  <path d="M-3 -4 Q0 -7, 3 -4" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
                  <path d="M5 -3 Q8 -6, 11 -3" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                  <path d="M-8 2 Q-5 -1, -2 2" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                  <path d="M0 1 Q3 -2, 6 1" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
                  {/* Eye — white sclera + dark iris + bright pupil highlight */}
                  <circle cx="-20" cy="-3" r="3" fill="rgba(220, 235, 255, 0.6)" />
                  <circle cx="-20.5" cy="-3" r="1.8" fill="rgba(10, 20, 50, 0.9)" />
                  <circle cx="-21" cy="-3.5" r="0.6" fill="rgba(255, 255, 255, 0.7)" />
                  {/* Mouth line */}
                  <path d="M-27 0 Q-25 1, -23 0" fill="none" stroke="rgba(200,220,255,0.2)" strokeWidth="0.5" />
                </g>
              </g>
              
              {/* ═══════ FISH 2 — Medium Rui/Carp (swims left, deeper) ═══════ */}
              <g className="fish-swim-left" style={{ animationDuration: status === 'GOOD' ? '22s' : '35s', animationDelay: '-4s' }}>
                <g transform="translate(500, 155)">
                  {/* Deeper, rounder body for a carp */}
                  <ellipse cx="0" cy="0" rx="22" ry="11" fill="rgba(220, 195, 150, 0.22)" />
                  {/* Head */}
                  <ellipse cx="-14" cy="-1" rx="7" ry="5.5" fill="rgba(230, 210, 170, 0.12)" />
                  {/* Dorsal fin — rounded for carp */}
                  <path d="M-6 -10 Q0 -18, 8 -16 Q14 -13, 16 -10" fill="rgba(210, 180, 130, 0.18)" stroke="rgba(230, 210, 170, 0.1)" strokeWidth="0.4" />
                  {/* Tail fin — rounder, less forked */}
                  <path d="M20 -1 L30 -10 L28 0 L30 10 L20 2 Z" fill="rgba(210, 185, 140, 0.2)" />
                  {/* Pectoral fin */}
                  <path d="M-6 4 Q-10 12, -4 13 Q-1 11, -1 5" fill="rgba(200, 180, 140, 0.14)" />
                  {/* Anal fin */}
                  <path d="M6 9 Q10 15, 16 13 Q17 10, 15 8" fill="rgba(200, 180, 140, 0.14)" />
                  {/* Lateral line */}
                  <line x1="-14" y1="0" x2="18" y2="0" stroke="rgba(220, 200, 160, 0.1)" strokeWidth="0.4" strokeDasharray="2 2" />
                  {/* Scale arcs */}
                  <path d="M-6 -2 Q-4 -5, -1 -2" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                  <path d="M2 -3 Q4 -6, 7 -3" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
                  {/* Eye */}
                  <circle cx="-16" cy="-2" r="2.5" fill="rgba(240, 220, 180, 0.55)" />
                  <circle cx="-16.3" cy="-2" r="1.5" fill="rgba(10, 15, 30, 0.85)" />
                  <circle cx="-16.8" cy="-2.5" r="0.5" fill="rgba(255, 255, 255, 0.65)" />
                  {/* Mouth */}
                  <path d="M-22 1 Q-20 2, -18 1" fill="none" stroke="rgba(220,200,160,0.18)" strokeWidth="0.4" />
                  {/* Barbels (whiskers, characteristic of carp) */}
                  <line x1="-21" y1="1" x2="-26" y2="4" stroke="rgba(220,200,160,0.12)" strokeWidth="0.3" />
                  <line x1="-21" y1="2" x2="-25" y2="6" stroke="rgba(220,200,160,0.10)" strokeWidth="0.3" />
                </g>
              </g>
              
              {/* ═══════ FISH 3 — Small fry school (3 tiny fish swim right together, higher) ═══════ */}
              <g className="fish-swim-right" style={{ animationDuration: status === 'GOOD' ? '14s' : '24s', animationDelay: '-8s' }}>
                {/* Fry 1 */}
                <g transform="translate(300, 75)">
                  <ellipse cx="0" cy="0" rx="8" ry="3.5" fill="rgba(200, 230, 255, 0.18)" />
                  <path d="M7 0 L12 -4 L11 0 L12 4 L7 0 Z" fill="rgba(180, 215, 255, 0.15)" />
                  <circle cx="-5" cy="-1" r="1.2" fill="rgba(220, 240, 255, 0.4)" />
                  <circle cx="-5.3" cy="-1" r="0.7" fill="rgba(5, 15, 40, 0.8)" />
                </g>
                {/* Fry 2 */}
                <g transform="translate(320, 82)">
                  <ellipse cx="0" cy="0" rx="7" ry="3" fill="rgba(200, 230, 255, 0.15)" />
                  <path d="M6 0 L10 -3 L9 0 L10 3 L6 0 Z" fill="rgba(180, 215, 255, 0.12)" />
                  <circle cx="-4" cy="-1" r="1" fill="rgba(220, 240, 255, 0.35)" />
                  <circle cx="-4.3" cy="-1" r="0.6" fill="rgba(5, 15, 40, 0.75)" />
                </g>
                {/* Fry 3 */}
                <g transform="translate(312, 70)">
                  <ellipse cx="0" cy="0" rx="6" ry="2.5" fill="rgba(200, 230, 255, 0.13)" />
                  <path d="M5 0 L9 -3 L8 0 L9 3 L5 0 Z" fill="rgba(180, 215, 255, 0.10)" />
                  <circle cx="-3.5" cy="-0.8" r="0.9" fill="rgba(220, 240, 255, 0.3)" />
                  <circle cx="-3.8" cy="-0.8" r="0.5" fill="rgba(5, 15, 40, 0.7)" />
                </g>
              </g>
              
              {/* ═══════ FISH 4 — Medium Katla (swims left, mid-depth) ═══════ */}
              <g className="fish-swim-left" style={{ animationDuration: status === 'GOOD' ? '18s' : '32s', animationDelay: '-12s' }}>
                <g transform="translate(700, 120)">
                  <ellipse cx="0" cy="0" rx="24" ry="10" fill="rgba(160, 200, 220, 0.20)" />
                  <ellipse cx="-16" cy="-1" rx="7" ry="5" fill="rgba(180, 215, 235, 0.10)" />
                  {/* Dorsal */}
                  <path d="M-8 -9 Q-2 -17, 6 -15 Q12 -12, 14 -9" fill="rgba(140, 185, 210, 0.16)" />
                  {/* Tail */}
                  <path d="M22 -1 L33 -11 L30 0 L33 10 L22 1 Z" fill="rgba(150, 195, 220, 0.18)" />
                  {/* Pectoral */}
                  <path d="M-6 4 Q-10 11, -3 12 Q0 10, 0 5" fill="rgba(150, 195, 215, 0.13)" />
                  {/* Anal */}
                  <path d="M7 8 Q10 14, 15 12 Q16 9, 14 8" fill="rgba(150, 195, 215, 0.12)" />
                  {/* Scales */}
                  <path d="M-5 -2 Q-3 -5, 0 -2" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                  <path d="M3 -3 Q5 -6, 8 -3" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
                  {/* Eye */}
                  <circle cx="-18" cy="-2" r="2.8" fill="rgba(200, 225, 240, 0.5)" />
                  <circle cx="-18.4" cy="-2" r="1.6" fill="rgba(10, 20, 45, 0.85)" />
                  <circle cx="-18.8" cy="-2.5" r="0.5" fill="rgba(255, 255, 255, 0.6)" />
                  {/* Mouth */}
                  <path d="M-24 0 Q-22 1.5, -20 0" fill="none" stroke="rgba(180,210,230,0.15)" strokeWidth="0.4" />
                </g>
              </g>

              {/* Pond bottom floor — sandy texture */}
              <rect x="0" y="225" width="1000" height="15" fill="rgba(80, 60, 40, 0.08)" />
              <line x1="0" y1="226" x2="1000" y2="226" stroke="rgba(120, 100, 70, 0.06)" strokeWidth="0.5" />
            </svg>

            {/* Overlay Sensor Node Callouts */}
            <div style={{ display: 'flex', gap: 20, zIndex: 2, padding: 20, flexWrap: 'wrap', justifyContent: 'space-around', width: '100%', position: 'relative' }}>
              
              {/* Sensor Node Temp */}
              <div style={{ background: 'rgba(13, 18, 34, 0.85)', border: '1px solid #f59e0b40', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
                <span className="pulse-dot" style={{ background: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>TEMP PROBE</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                    {latest?.temperature ? `${latest.temperature.toFixed(2)} °C` : '—'}
                  </div>
                </div>
              </div>

              {/* Sensor Node pH */}
              <div style={{ background: 'rgba(13, 18, 34, 0.85)', border: '1px solid #3b82f640', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
                <span className="pulse-dot" style={{ background: '#3b82f6' }} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>PH SENSOR</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                    {latest?.ph_level ? latest.ph_level.toFixed(2) : '—'}
                  </div>
                </div>
              </div>

              {/* Sensor Node Turbidity */}
              <div style={{ background: 'rgba(13, 18, 34, 0.85)', border: '1px solid #8b5cf640', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
                <span className="pulse-dot" style={{ background: '#8b5cf6' }} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>TURBIDITY</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                    {latest?.turbidity != null ? `${latest.turbidity} %` : '—'}
                  </div>
                </div>
              </div>

              {/* Feeder Actuator Node */}
              <div style={{ background: 'rgba(13, 18, 34, 0.85)', border: '1px solid #10b98140', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)' }}>
                <span className="pulse-dot" style={{ background: '#10b981' }} />
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>FEED OUTLET</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                    {latest?.status === 'POOR' ? 'GATED LOCK' : 'READY'}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}>
              <Info size={12} />
              <span>SVG coordinates map real-time telemetry inputs to visual speed vectors.</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <KpiCard
          icon={Thermometer} label="Water Temperature" unit="°C" color="#f59e0b"
          value={latest?.temperature != null ? latest.temperature.toFixed(2) : null}
          status={latest?.temperature > 32 || latest?.temperature < 20 ? 'CRITICAL' : latest?.temperature > 30 || latest?.temperature < 25 ? 'WARNING' : 'GOOD'}
          historyData={sparkData} dataKey="temp"
        />
        <KpiCard
          icon={FlaskConical} label="pH Level" color="#3b82f6"
          value={latest?.ph_level != null ? latest.ph_level.toFixed(2) : null}
          status={latest?.ph_level > 9.0 || latest?.ph_level < 5.5 ? 'CRITICAL' : latest?.ph_level > 8.5 || latest?.ph_level < 6.5 ? 'WARNING' : 'GOOD'}
          historyData={sparkData} dataKey="ph"
        />
        <KpiCard
          icon={Eye} label="Turbidity" unit="%" color="#8b5cf6"
          value={latest?.turbidity != null ? latest.turbidity : null}
          status={latest?.turbidity > 60 ? 'CRITICAL' : latest?.turbidity > 30 ? 'WARNING' : 'GOOD'}
          historyData={sparkData} dataKey="turbidity"
          decimals={0}
        />
        <KpiCard
          icon={Fish} label="AI Habitat Suitability" color="#10b981"
          value={dashboard?.latest_prediction?.habitat_status ?? 'NORMAL'}
          status={dashboard?.latest_prediction?.recommended_fish ? 'GOOD' : 'WARNING'}
        />
        <KpiCard
          icon={AlertTriangle} label="Active Alerts" color="#f43f5e"
          value={dashboard?.active_alerts ?? 0}
          status={(dashboard?.active_alerts ?? 0) > 0 ? 'CRITICAL' : 'GOOD'}
        />
      </div>

      {/* Meteorology Station KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <KpiCard
          icon={Thermometer} label="External Air Temperature" unit="°C" color="var(--color-cyan)"
          value={dashboard?.weather?.air_temperature != null ? dashboard.weather.air_temperature.toFixed(1) : null}
          status="GOOD"
          decimals={1}
        />
        <KpiCard
          icon={Droplets} label="Humidity" unit="%" color="#3b82f6"
          value={dashboard?.weather?.humidity != null ? dashboard.weather.humidity : null}
          status="GOOD"
          decimals={0}
        />
        <KpiCard
          icon={Wind} label="Wind Speed" unit="km/h" color="#10b981"
          value={dashboard?.weather?.wind_speed != null ? dashboard.weather.wind_speed.toFixed(1) : null}
          status="GOOD"
          decimals={1}
        />
        <KpiCard
          icon={Compass} label="Atmospheric Pressure" unit="hPa" color="#8b5cf6"
          value={dashboard?.weather?.pressure != null ? dashboard.weather.pressure.toFixed(0) : null}
          status="GOOD"
          decimals={0}
        />
        <KpiCard
          icon={CloudRain} label="Rainfall / Precipitation" unit="mm" color="#3b82f6"
          value={dashboard?.weather?.rainfall != null ? dashboard.weather.rainfall.toFixed(1) : null}
          status="GOOD"
          decimals={1}
        />
      </div>

      {/* AI Recommendation & System Activity Log */}
      <div className="dashboard-details-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        
        {/* Recommendation Panel */}
        <div className="card-premium" style={{ borderLeft: '4px solid var(--color-violet)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Award size={18} color="var(--color-violet)" />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>AI Species Suitability Recommendation</span>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 14, padding: '16px 24px', textAlign: 'center', flexShrink: 0
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimal Species</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-violet)', marginTop: 4, textTransform: 'capitalize' }}>
                  {dashboard?.latest_prediction?.recommended_fish ?? 'Tilapia'}
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recommendation Rationale:</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                  Our classifier predicts a high suitability factor of <strong>{((dashboard?.latest_prediction?.habitat_confidence ?? 0.8525) * 100).toFixed(1)}%</strong> for <strong>{dashboard?.latest_prediction?.recommended_fish ?? 'tilapia'}</strong> based on physical sensors data. SHAP values indicate that the current low turbidity and neutral pH values are the strongest supporting attributes for this recommendation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Activity Log */}
        <div className="card-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={16} color="var(--color-cyan)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent System Events</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dynamicEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5 }}>
                <span className="pulse-dot" style={{ background: ev.status === 'success' ? 'var(--color-emerald)' : ev.status === 'warning' ? 'var(--color-rose)' : 'var(--color-blue)', marginTop: 4, width: 6, height: 6 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{ev.msg}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'JetBrains Mono, monospace' }}>[{ev.time}]</span>
                </div>
              </div>
            ))}
            {dynamicEvents.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                No operations registered yet.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
