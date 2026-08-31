import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Fish, RefreshCw, AlertTriangle, Play, HelpCircle, Calendar, PlusCircle, CheckCircle } from 'lucide-react';
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
  { key: 'timestamp',   label: 'TIME',            render: v => safeFormatDate(v) },
  { key: 'feed_amount', label: 'FEED AMOUNT (G)',  render: v => v != null ? Number(v).toFixed(1) : '—' },
  { key: 'feed_type',   label: 'FEED TYPE',        render: v => v ?? '—' },
  { key: 'method',      label: 'METHOD',           render: v => v ?? '—' },
  { key: 'notes',       label: 'NOTES',            sortable: false,
    render: v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v ?? '—'}</span> },
];

export default function FishFeeding() {
  const [feedData, setFeedData] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastUpd,  setLastUpd]  = useState('');
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState('');

  // Feeding trigger form states
  const [feedDuration, setFeedDuration] = useState(10);
  const [feedReason, setFeedReason] = useState('Manual supplement feed');
  const [feedLoading, setFeedLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const raw = await api.getFeeding(168).catch(() => []);
      setFeedData(Array.isArray(raw) ? raw : raw?.data ?? []);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const triggerFeedAction = async () => {
    setFeedLoading(true);
    setError(null);
    setSuccess('');
    try {
      // Calculate feeding amount based on duration: 10g per second
      const calculatedAmount = feedDuration * 10;
      const res = await api.triggerFeed({
        mode: 'manual',
        duration: Number(feedDuration),
        reason: `${feedReason} (${calculatedAmount}g)`
      });

      // Optimistically insert new record into local state so UI updates instantly
      const newLog = {
        timestamp: res.timestamp || new Date().toISOString(),
        feed_amount: calculatedAmount,
        feed_type: 'Standard Pellets',
        method: 'Manual',
        notes: res.reason || feedReason
      };

      setFeedData(prev => [newLog, ...prev]);
      setSuccess(`Feeding session completed! Duration: ${res.duration_seconds ?? feedDuration}s (${calculatedAmount}g). Log saved.`);
      setTimeout(() => setSuccess(''), 4000);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setFeedLoading(false);
    }
  };

  const totalFeed = feedData.reduce((s, r) => s + Number(r.feed_amount ?? 0), 0);
  const avgFeed   = feedData.length ? totalFeed / feedData.length : 0;

  /* chart: last 14 feedings */
  const chartData = feedData.slice(0, 14).reverse().map((r, i) => ({
    label: r.timestamp ? safeFormatDate(r.timestamp, 'MM/dd HH:mm') : `#${i+1}`,
    amount: r.feed_amount != null ? +Number(r.feed_amount).toFixed(1) : 0,
  }));

  /* feed type breakdown */
  const typeBreakdown = feedData.reduce((acc, r) => {
    const t = r.feed_type ?? 'Standard Pellet';
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="gradient-text glow-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Fish size={24} color="var(--color-emerald)" /> Feeding Operations
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Control feeder relays, view upcoming feeding schedules, and monitor pellet inventory levels
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

      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12, padding: '14px 18px',
          color: 'var(--color-emerald)', fontSize: 13, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

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

      {/* Top dashboard section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 300px', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        
        {/* Feeder Controller panel */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Play size={16} color="var(--color-emerald)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Manual Feeder Dispatcher</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Feeder Duration: <span style={{ color: 'var(--color-emerald)', fontFamily: 'JetBrains Mono' }}>{feedDuration}s</span>
              </label>
              <input
                type="range" min="5" max="30" step="1" value={feedDuration}
                onChange={e => setFeedDuration(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Approx dosage: {feedDuration * 10}g</div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Session Notes
              </label>
              <input
                type="text" value={feedReason}
                onChange={e => setFeedReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px' }}
                placeholder="Supplemental feeding"
              />
            </div>
          </div>

          <button className="btn-premium" onClick={triggerFeedAction} disabled={feedLoading} style={{ alignSelf: 'flex-start', marginTop: 'auto', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
            <span>{feedLoading ? 'Actuating Feeder...' : 'Trigger Feeder Actuator'}</span>
          </button>
        </div>

        {/* Feed Inventory Dial */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            Pellet Inventory
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-color)' }}>Simulated</span>
          </div>
          
          <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 12 }}>
            <svg width="100%" height="100%" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-color)" strokeWidth="3" style={{ opacity: 0.3 }} />
              <circle
                cx="18" cy="18" r="15.915" fill="none"
                stroke="var(--color-emerald)"
                strokeWidth="3.2"
                strokeDasharray="82 100"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              82%
            </div>
          </div>
          
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Capacity: 20.5kg remaining</div>
        </div>

        {/* Upcoming Routine Feed timings */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            <Calendar size={14} color="var(--color-blue)" />
            <span>Upcoming Schedules</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>Morning Feed</div>
              <div style={{ fontSize: 12, color: 'var(--color-blue)', fontFamily: 'JetBrains Mono' }}>08:00 AM</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>Evening Feed</div>
              <div style={{ fontSize: 12, color: 'var(--color-blue)', fontFamily: 'JetBrains Mono' }}>06:00 PM</div>
            </div>
          </div>
        </div>

      </div>

      {/* Consumption Trend & Feed Type Breakdown */}
      <div className="dashboard-details-grid" style={{ marginBottom: 28 }}>
        
        {/* Feed consumption chart */}
        <div className="card-premium">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Feeding Volume History (grams per session)
          </div>

          <div style={{ width: '100%', height: 220 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" height={35} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} stroke="var(--border-color)" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', fontSize: 11 }}>
                          Amount: <strong style={{ color: 'var(--color-emerald)' }}>{payload[0].value} g</strong>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="amount" name="Feed amount" fill="var(--color-emerald)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No feeding data logged in this range
              </div>
            )}
          </div>
        </div>

        {/* Feed Type Breakdown */}
        <div className="card-premium">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Feed Blend Distribution
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(typeBreakdown).map(([type, count], i) => {
              const colors = ['var(--color-blue)', 'var(--color-emerald)', 'var(--color-amber)', 'var(--color-violet)'];
              const total  = Object.values(typeBreakdown).reduce((a, b) => a + b, 0);
              const pct    = total ? ((count / total) * 100).toFixed(0) : 0;
              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{type}</span>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{count} logs ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 6, width: '100%' }}>
                    <div style={{ background: colors[i % colors.length], borderRadius: 6, height: '100%', width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(typeBreakdown).length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>
                No feed blend logs found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          Feeder Operation Logs
        </div>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', gap: 12, padding: '6px 0' }}>
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
                <div className="skeleton" style={{ height: 14 }} />
              </div>
            ))}
          </div>
        ) : (
          <DataTable columns={COLS} data={feedData} />
        )}
      </div>

    </div>
  );
}
