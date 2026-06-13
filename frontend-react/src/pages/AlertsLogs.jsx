import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Bell, RefreshCw, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import DataTable from '../components/DataTable';

// Alerts are derived from sensor history — POOR/MODERATE status = alert
function buildAlertsFromHistory(history) {
  return history
    .filter(r => r.status === 'POOR' || r.status === 'MODERATE')
    .map(r => ({
      timestamp: r.timestamp,
      alert_type: r.status === 'POOR' ? 'Water Quality Critical' : 'Water Quality Warning',
      severity:   r.status === 'POOR' ? 'CRITICAL' : 'WARNING',
      message:    `pH: ${r.ph?.toFixed(2) ?? '—'} | Temp: ${r.temperature?.toFixed(1) ?? '—'}°C | Turbidity: ${r.turbidity ?? '—'}%`,
      status:     r.status,
    }));
}

function SevBadge({ v }) {
  if (!v) return '—';
  const cls = v === 'CRITICAL' ? 'status-critical' : v === 'WARNING' ? 'status-warning' : 'status-good';
  const Icon = v === 'CRITICAL' ? AlertCircle : v === 'WARNING' ? AlertTriangle : CheckCircle;
  return (
    <span className={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Icon size={12} /> {v}
    </span>
  );
}

const COLS = [
  { key: 'timestamp',  label: 'TIME',       render: v => { try { return format(new Date(v), 'MM/dd/yyyy HH:mm:ss'); } catch { return v ?? '—'; } } },
  { key: 'alert_type', label: 'TYPE',       render: v => v ?? '—' },
  { key: 'severity',   label: 'SEVERITY',   sortable: false, render: v => <SevBadge v={v} /> },
  { key: 'message',    label: 'MESSAGE',    sortable: false,
    render: v => <span style={{ fontSize: 12, color: '#c9d1d9' }}>{v ?? '—'}</span> },
];

export default function AlertsLogs() {
  const [history, setHistory] = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpd, setLastUpd] = useState('');
  const [filter,  setFilter]  = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Derive alerts from sensor history (POOR/MODERATE readings)
      const hist = await api.getHistory(168).catch(() => ({ data: [] }));
      const arr  = Array.isArray(hist) ? hist : (hist?.data ?? []);
      setHistory(arr);
      setAlerts(buildAlertsFromHistory(arr));
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
    WARNING:  alerts.filter(a => a.severity === 'WARNING').length,
  };

  const filtered =
    filter === 'ALL'      ? alerts :
    filter === 'CRITICAL' ? alerts.filter(a => a.severity === 'CRITICAL') :
    filter === 'WARNING'  ? alerts.filter(a => a.severity === 'WARNING')  : alerts;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={22} color="#f59e0b" /> Alerts Logs
          </h1>
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>
            Derived from sensor history — POOR and MODERATE water quality events
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpd && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}><span className="pulse-dot" />{lastUpd}</div>}
          <button className="btn-ghost" onClick={load} disabled={loading}><RefreshCw size={13} /> {loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Readings (7d)', value: history.length,   color: '#8b949e' },
          { label: 'Total Alerts',        value: alerts.length,    color: '#f59e0b' },
          { label: 'Critical',            value: counts.CRITICAL,  color: '#f85149' },
          { label: 'Warnings',            value: counts.WARNING,   color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, letterSpacing: '-0.03em' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Good status banner if no alerts */}
      {!loading && alerts.length === 0 && (
        <div style={{
          background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.25)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#3fb950',
        }}>
          <CheckCircle size={16} />
          All readings in the last 7 days are within GOOD range. No alerts generated.
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['ALL', 'CRITICAL', 'WARNING'].map(f => (
          <button
            key={f}
            className={`tab-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== 'ALL' && (
              <span style={{ marginLeft: 4, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                {counts[f] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>Loading…</div>
        ) : (
          <DataTable columns={COLS} data={filtered} />
        )}
      </div>
    </div>
  );
}
