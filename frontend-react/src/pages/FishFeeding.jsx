import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Fish, RefreshCw, Play } from 'lucide-react';
import { api } from '../services/api';
import DataTable from '../components/DataTable';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1c2333', border: '1px solid #30363d', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#8b949e', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
}

const COLS = [
  { key: 'timestamp', label: 'TIME',         render: v => { try { return format(new Date(v), 'MM/dd/yyyy HH:mm:ss'); } catch { return v ?? '—'; } } },
  { key: 'mode',      label: 'MODE',         render: v => v ?? '—' },
  { key: 'status',    label: 'STATUS',       sortable: false, render: v => {
    const cls = v === 'COMPLETED' ? 'status-good' : v === 'FAILED' ? 'status-critical' : 'status-warning';
    return <span className={cls}>{v ?? 'COMPLETED'}</span>;
  }},
  { key: 'duration',  label: 'DURATION (S)', render: v => v ?? '—' },
  { key: 'reason',    label: 'REASON',       sortable: false,
    render: v => <span style={{ fontSize: 12, color: '#8b949e' }}>{v ?? '—'}</span> },
];

export default function FishFeeding() {
  const [logs,     setLogs]     = useState([]);
  const [status,   setStatus]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [feeding,  setFeeding]  = useState(false);
  const [lastUpd,  setLastUpd]  = useState('');
  const [feedMsg,  setFeedMsg]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statusRes] = await Promise.all([
        api.getFeeding(168).catch(() => ({ data: [] })),
        api.getFeedingStatus().catch(() => null),
      ]);
      setLogs(Array.isArray(logsRes) ? logsRes : (logsRes?.data ?? []));
      setStatus(statusRes);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Manual feeding trigger
  const handleFeed = async (mode) => {
    setFeeding(true); setFeedMsg('');
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, reason: `Manual trigger from dashboard` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedMsg('⚠ ' + (data.detail ?? 'Feeding failed'));
      } else {
        setFeedMsg('✓ Feeding triggered successfully!');
        await load();
      }
    } catch (e) {
      setFeedMsg('⚠ ' + e.message);
    } finally {
      setFeeding(false);
      setTimeout(() => setFeedMsg(''), 4000);
    }
  };

  // Mode breakdown
  const modeBreakdown = logs.reduce((acc, r) => {
    const m = r.mode ?? 'unknown';
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});

  // Chart: last 14 sessions
  const chartData = [...logs].reverse().slice(-14).map((r, i) => ({
    label:    r.timestamp ? format(new Date(r.timestamp), 'MM/dd HH:mm') : `#${i+1}`,
    duration: r.duration ?? 0,
  }));

  const totalSessions = logs.length;
  const totalTime     = logs.reduce((s, r) => s + (r.duration ?? 0), 0);
  const avgDuration   = totalSessions ? (totalTime / totalSessions).toFixed(1) : '—';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Fish size={22} color="#3fb950" /> Fish Feeding
          </h1>
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>Feeding schedule, logs, and manual controls</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpd && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}><span className="pulse-dot" />{lastUpd}</div>}
          <button className="btn-ghost" onClick={load} disabled={loading}><RefreshCw size={13} /> {loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {/* Manual feeding controls */}
      <div style={{
        background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
        padding: '18px 20px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 12 }}>
          Manual Feeding Control
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {['manual', 'auto', 'scheduled'].map(mode => (
            <button
              key={mode}
              className="btn-primary"
              onClick={() => handleFeed(mode)}
              disabled={feeding}
              style={{ textTransform: 'capitalize' }}
            >
              <Play size={12} /> {mode} feeding
            </button>
          ))}
          {feedMsg && (
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: feedMsg.startsWith('✓') ? '#3fb950' : '#f59e0b',
              marginLeft: 8,
            }}>{feedMsg}</span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Sessions (7d)', value: totalSessions,                  color: '#3fb950' },
          { label: 'Total Duration (s)',  value: totalTime,                       color: '#3b82f6' },
          { label: 'Avg Duration (s)',    value: avgDuration,                     color: '#f59e0b' },
          { label: 'Last Feeding',        value: status?.last_feeding?.timestamp
              ? format(new Date(status.last_feeding.timestamp), 'HH:mm')
              : '—',                                                              color: '#8b5cf6' },
          { label: 'Sessions Today',      value: status?.total_today ?? '—',     color: '#06b6d4' },
          { label: 'Feed Modes',          value: Object.keys(modeBreakdown).length, color: '#e3b341' },
        ].map(c => (
          <div key={c.label} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: '#8b949e', fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, letterSpacing: '-0.02em', fontFamily: 'JetBrains Mono, monospace' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Duration chart */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>Feeding Duration per Session</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8b949e' }} angle={-30} textAnchor="end" height={44} />
                <YAxis tick={{ fontSize: 11, fill: '#8b949e' }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="duration" name="Duration (s)" fill="#3fb950" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No feeding data yet'}
            </div>
          )}
        </div>

        {/* Mode breakdown */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>Mode Breakdown</div>
          {Object.entries(modeBreakdown).length > 0 ? (
            Object.entries(modeBreakdown).map(([mode, count], i) => {
              const total = logs.length;
              const pct   = total ? ((count/total)*100).toFixed(0) : 0;
              const colors = ['#3b82f6','#3fb950','#f59e0b','#8b5cf6'];
              return (
                <div key={mode} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#e6edf3', textTransform: 'capitalize' }}>{mode}</span>
                    <span style={{ color: '#8b949e', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ background: '#21262d', borderRadius: 4, height: 6 }}>
                    <div style={{ background: colors[i % colors.length], borderRadius: 4, height: '100%', width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: '#8b949e', fontSize: 13, textAlign: 'center', paddingTop: 24 }}>
              {loading ? 'Loading…' : 'No data yet'}
            </div>
          )}
        </div>
      </div>

      {/* Logs table */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>
          Feeding Log (7 days) — {logs.length} records
        </div>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>Loading…</div>
        ) : (
          <DataTable columns={COLS} data={logs} />
        )}
      </div>
    </div>
  );
}
