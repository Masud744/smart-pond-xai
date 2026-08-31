import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { Database, Search, Calendar, Download, RefreshCw, FileText, Server } from 'lucide-react';

const TABS = [
  { id: 'water',      label: 'Water Sensors Data'       },
  { id: 'weather',    label: 'Weather Analytics'        },
  { id: 'quality',    label: 'Quality Predictions'      },
  { id: 'habitat',    label: 'Habitat Recommendations'  },
  { id: 'alerts',     label: 'Diagnostic Alerts'        },
  { id: 'xai',        label: 'Explainable AI Log'       },
  { id: 'feeding',    label: 'Feeder Operations'        },
];

const fmtTime = v => v ? format(new Date(v), 'MM/dd/yyyy HH:mm:ss') : '—';
const fmtNum  = (v, dp = 2) => v != null ? Number(v).toFixed(dp) : '—';

function StatusBadge({ v }) {
  if (!v) return '—';
  const cls = v === 'GOOD' || v === 'COMPLETED' ? 'badge-good' : v === 'WARNING' ? 'badge-warning' : 'badge-critical';
  return <span className={`status-badge ${cls}`}>{v}</span>;
}

const COLUMNS = {
  water: [
    { key: 'timestamp',   label: 'TIME',           render: v => fmtTime(v) },
    { key: 'temperature', label: 'WATER TEMP (°C)',render: v => fmtNum(v) },
    { key: 'ph_level',    label: 'PH LEVEL',       render: v => fmtNum(v) },
    { key: 'turbidity',   label: 'TURBIDITY (%)',   render: v => v != null ? `${v}%` : '—' },
    { key: 'status',      label: 'STATUS',          render: v => <StatusBadge v={v} />, sortable: false },
  ],
  weather: [
    { key: 'timestamp',    label: 'TIME',               render: v => fmtTime(v) },
    { key: 'air_temp',     label: 'AIR TEMP (°C)',      render: v => fmtNum(v) },
    { key: 'humidity',     label: 'HUMIDITY (%)',        render: v => v != null ? `${v}%` : '—' },
    { key: 'rainfall',     label: 'RAINFALL (MM)',       render: v => fmtNum(v) },
    { key: 'wind_speed',   label: 'WIND SPEED (KM/H)',  render: v => fmtNum(v) },
    { key: 'pressure',     label: 'PRESSURE (HPA)',      render: v => fmtNum(v, 1) },
  ],
  quality: [
    { key: 'timestamp',   label: 'TIME',         render: v => fmtTime(v) },
    { key: 'prediction',  label: 'PREDICTION',   render: v => v ?? '—' },
    { key: 'confidence',  label: 'CONFIDENCE',   render: v => v != null ? `${(v*100).toFixed(1)}%` : '—' },
    { key: 'status',      label: 'STATUS',       render: v => <StatusBadge v={v} />, sortable: false },
    { key: 'temperature', label: 'TEMPERATURE',  render: v => fmtNum(v) },
    { key: 'ph_level',    label: 'PH LEVEL',     render: v => fmtNum(v) },
  ],
  habitat: [
    { key: 'timestamp',       label: 'TIME',               render: v => fmtTime(v) },
    { key: 'habitat_status',  label: 'HABITAT STATUS',     render: v => <StatusBadge v={v} />, sortable: false },
    { key: 'suitability',     label: 'SUITABILITY',        render: v => v != null ? `${(v*100).toFixed(1)}%` : '—' },
    { key: 'fish_count',      label: 'FISH COUNT',         render: v => v ?? '—' },
    { key: 'recommendation',  label: 'RECOMMENDATION',     sortable: false,
      render: v => v ? <span style={{ display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> : '—' },
  ],
  alerts: [
    { key: 'timestamp',    label: 'TIME',       render: v => fmtTime(v) },
    { key: 'alert_type',   label: 'TYPE',       render: v => v ?? '—' },
    { key: 'severity',     label: 'SEVERITY',   render: v => <StatusBadge v={v} />, sortable: false },
    { key: 'message',      label: 'MESSAGE',    sortable: false,
      render: v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v ?? '—'}</span> },
    { key: 'resolved',     label: 'RESOLVED',
      render: v => <span style={{ color: v ? 'var(--color-emerald)' : 'var(--color-amber)', fontWeight: 700, fontSize: 12 }}>{v ? 'YES' : 'NO'}</span> },
  ],
  xai: [
    { key: 'timestamp',   label: 'TIME',            render: v => fmtTime(v) },
    { key: 'feature',     label: 'FEATURE',         render: v => v ?? '—' },
    { key: 'importance',  label: 'IMPORTANCE',      render: v => v != null ? Number(v).toFixed(4) : '—' },
    { key: 'direction',   label: 'DIRECTION',       render: v => {
      const isPos = v === 'positive';
      return (
        <span className={isPos ? 'status-badge badge-good' : 'status-badge badge-critical'} style={{ fontSize: 10, padding: '2px 8px' }}>
          {String(v).toUpperCase()}
        </span>
      );
    }},
    { key: 'explanation', label: 'EXPLANATION',     sortable: false,
      render: v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v ?? '—'}</span> },
  ],
  feeding: [
    { key: 'timestamp',    label: 'TIME',           render: v => fmtTime(v) },
    { key: 'feed_amount',  label: 'FEED AMOUNT (G)',render: v => fmtNum(v, 1) },
    { key: 'feed_type',    label: 'FEED TYPE',      render: v => v ?? '—' },
    { key: 'method',       label: 'METHOD',         render: v => v ?? '—' },
    { key: 'notes',        label: 'NOTES',          sortable: false,
      render: v => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v ?? '—'}</span> },
  ],
};

export default function DatabaseExplorer() {
  const [activeTab, setActiveTab] = useState('water');
  const [hours,     setHours]     = useState('24');
  const [search,    setSearch]    = useState('');
  
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [lastUpd, setLastUpd] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let raw;
      const hVal = Number(hours);
      if      (activeTab === 'water')   raw = await api.getHistory(hVal);
      else if (activeTab === 'weather') raw = await api.getWeather(hVal);
      else if (activeTab === 'quality') raw = await api.getPredictions(hVal);
      else if (activeTab === 'habitat') raw = await api.getFishHabitat(hVal);
      else if (activeTab === 'alerts')  raw = await api.getAlerts(hVal);
      else if (activeTab === 'xai')     raw = await api.getXAI(hVal);
      else if (activeTab === 'feeding') raw = await api.getFeeding(hVal);
      else raw = [];
      
      const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const sortedArr = [...arr].sort((a, b) => {
        const tA = new Date(String(a.timestamp || a.time || 0).replace(' ', 'T')).getTime();
        const tB = new Date(String(b.timestamp || b.time || 0).replace(' ', 'T')).getTime();
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      });
      setData(sortedArr);
      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, hours]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(val => String(val ?? '').toLowerCase().includes(q))
    );
  }, [data, search]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_records_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header controls layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="gradient-text glow-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={24} color="var(--color-blue)" /> InfluxDB Database Explorer
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Inspect raw time-series measurements tables directly from the cloud database cluster
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpd && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <span className="pulse-dot" />
              <span>Synced {lastUpd}</span>
            </div>
          )}
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={14} />
            <span>Export JSON</span>
          </button>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Table</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 12, padding: '14px 18px',
          color: 'var(--color-rose)', fontSize: 13, marginBottom: 24,
        }}>
          ⚠️ Could not handshake database: {error}
        </div>
      )}

      {/* Tabs list selector */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 20, scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setSearch(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Server size={13} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter and query toolbar */}
      <div className="card-premium" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        
        {/* search input */}
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Search across ${filtered.length} rows in active index...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 36 }}
          />
        </div>

        {/* time limits dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={14} color="var(--text-muted)" />
          <select value={hours} onChange={e => setHours(e.target.value)}>
            <option value="1">Last 1 Hour</option>
            <option value="6">Last 6 Hours</option>
            <option value="24">Last 24 Hours</option>
            <option value="72">Last 3 Days</option>
            <option value="168">Last 7 Days</option>
            <option value="720">Last 30 Days</option>
            <option value="2160">Last 90 Days</option>
          </select>
        </div>

        {/* count badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <FileText size={13} color="var(--color-blue)" />
          <span>{filtered.length} matching rows found</span>
        </div>
      </div>

      {/* Main Table view */}
      <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Header skeleton */}
            <div style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {(COLUMNS[activeTab] ?? []).map((col) => (
                <div key={col.key} className="skeleton" style={{ height: 12, flex: 1 }} />
              ))}
            </div>
            {/* Row skeletons */}
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                {(COLUMNS[activeTab] ?? []).map((col) => (
                  <div key={col.key} className="skeleton" style={{ height: 14, flex: 1 }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <DataTable columns={COLUMNS[activeTab] ?? []} data={filtered} />
        )}
      </div>

    </div>
  );
}
