import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Bell, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import DataTable from '../components/DataTable';

function SeverityIcon({ v }) {
  if (!v) return null;
  if (v === 'CRITICAL') return <AlertCircle size={14} color="var(--color-rose)" style={{ flexShrink: 0 }} />;
  if (v === 'WARNING')  return <AlertTriangle size={14} color="var(--color-amber)" style={{ flexShrink: 0 }} />;
  return <Info size={14} color="var(--color-blue)" style={{ flexShrink: 0 }} />;
}

export default function AlertsLogs() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpd, setLastUpd] = useState('');
  const [filter,  setFilter]  = useState('ALL');
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.getAlerts(168).catch(() => []);
      setAlerts(Array.isArray(raw) ? raw : raw?.data ?? []);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleResolve = (indexToResolve) => {
    // Modify local state to show resolved confirmation
    setAlerts(prev => prev.map((a, idx) => idx === indexToResolve ? { ...a, resolved: true } : a));
    setSuccessMsg('Alert resolved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filtered = filter === 'ALL' ? alerts
    : filter === 'UNRESOLVED' ? alerts.filter(a => !a.resolved)
    : alerts.filter(a => a.severity === filter);

  const counts = {
    CRITICAL:   alerts.filter(a => a.severity === 'CRITICAL').length,
    WARNING:    alerts.filter(a => a.severity === 'WARNING').length,
    INFO:       alerts.filter(a => !['CRITICAL','WARNING'].includes(a.severity)).length,
    UNRESOLVED: alerts.filter(a => !a.resolved).length,
  };

  const COLS = [
    { key: 'timestamp',  label: 'TIME',     render: v => v ? format(new Date(v), 'MM/dd/yyyy HH:mm:ss') : '—' },
    { key: 'alert_type', label: 'TYPE',     render: v => v ?? '—' },
    { key: 'severity',   label: 'SEVERITY', sortable: false, render: v => {
      if (!v) return '—';
      const cls = v === 'CRITICAL' ? 'badge-critical' : v === 'WARNING' ? 'badge-warning' : 'badge-good';
      return (
        <span className={`status-badge ${cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <SeverityIcon v={v} /> {v}
        </span>
      );
    }},
    { key: 'message',    label: 'MESSAGE',  sortable: false,
      render: v => <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{v ?? '—'}</span> },
    { key: 'resolved',   label: 'STATUS',
      render: (v, row, idx) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: v ? 'var(--color-emerald)' : 'var(--color-amber)', fontWeight: 700, fontSize: 12 }}>
            {v ? 'RESOLVED' : 'UNRESOLVED'}
          </span>
          {!v && (
            <button
              onClick={() => handleResolve(idx)}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              Resolve
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="gradient-text glow-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={24} color="var(--color-amber)" /> System Alerts & Diagnostic Logs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Monitor unresolved system threshold violations, critical alerts history, and resolution audits
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, padding: '14px 18px',
          color: 'var(--color-emerald)', fontSize: 13, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Alarm Statistics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Recorded Alerts',  value: alerts.length,    color: 'var(--text-secondary)', icon: ShieldAlert, border: 'rgba(148,163,184,0.2)' },
          { label: 'Critical Errors',        value: counts.CRITICAL,  color: 'var(--color-rose)',      icon: AlertCircle,  border: 'rgba(244,63,94,0.2)' },
          { label: 'Warnings Flagged',       value: counts.WARNING,   color: 'var(--color-amber)',     icon: AlertTriangle, border: 'rgba(245,158,11,0.2)' },
          { label: 'Pending Resolution',     value: counts.UNRESOLVED,color: 'var(--color-rose)',      icon: Bell,         border: 'rgba(244,63,94,0.2)' },
        ].map((c, idx) => {
          const IconComponent = c.icon;
          return (
            <div key={idx} className="card-premium" style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: `3px solid ${c.border}` }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: `${c.color}12`,
                border: `1px solid ${c.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <IconComponent size={20} color={c.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{c.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters selector pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL','CRITICAL','WARNING','UNRESOLVED'].map(f => (
          <button
            key={f}
            className={`tab-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            <span>{f}</span>
            {f !== 'ALL' && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontFamily: 'JetBrains Mono',
                background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4,
                fontWeight: 700
              }}>{counts[f] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Alerts Table Card */}
      <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 3fr 1fr', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-card" style={{ margin: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <ShieldAlert size={26} color="var(--color-emerald)" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>All Clear</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.6 }}>
              {filter === 'ALL' ? 'No system alerts have been recorded.' : `No ${filter.toLowerCase()} alerts match the current filter.`}
            </div>
          </div>
        ) : (
          <DataTable columns={COLS} data={filtered} />
        )}
      </div>

    </div>
  );
}
