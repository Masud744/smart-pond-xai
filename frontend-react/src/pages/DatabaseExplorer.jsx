import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import TabBar from '../components/TabBar';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';

/* ── Tabs ── */
const TABS = [
  { id: 'water',      label: 'Water Sensor Data'        },
  { id: 'weather',    label: 'Weather Data'              },
  { id: 'quality',    label: 'Water Quality Predictions' },
  { id: 'habitat',    label: 'Fish Habitat Predictions'  },
  { id: 'xai',        label: 'XAI Explanations'         },
  { id: 'feeding',    label: 'Feeding Logs'              },
];

/* ── Helpers ── */
const fmtTime = v => {
  if (!v) return '—';
  try { return format(new Date(v), 'MM/dd/yyyy HH:mm:ss'); } catch { return v; }
};
const fmtNum = (v, dp = 2) => v != null ? Number(v).toFixed(dp) : '—';

function StatusBadge({ v }) {
  if (!v) return '—';
  const cls =
    v === 'GOOD'     ? 'status-good' :
    v === 'MODERATE' ? 'status-warning' :
    v === 'POOR'     ? 'status-critical' :
    v === 'SUITABLE' ? 'status-good' :
    v === 'UNSUITABLE' ? 'status-critical' : 'status-warning';
  return <span className={cls}>{v}</span>;
}

/* ── Column definitions per tab ── */
const COLUMNS = {
  water: [
    { key: 'timestamp',   label: 'TIME',            render: v => fmtTime(v) },
    { key: 'temperature', label: 'TEMPERATURE (°C)', render: v => fmtNum(v) },
    { key: 'ph',          label: 'PH LEVEL',         render: v => fmtNum(v) },
    { key: 'turbidity',   label: 'TURBIDITY (%)',    render: v => v != null ? `${v}%` : '—' },
    { key: 'status',      label: 'STATUS',           render: v => <StatusBadge v={v} />, sortable: false },
  ],
  weather: [
    { key: 'timestamp',  label: 'TIME',              render: v => fmtTime(v) },
    { key: 'air_temp',   label: 'AIR TEMP (°C)',     render: v => fmtNum(v) },
    { key: 'humidity',   label: 'HUMIDITY (%)',       render: v => v != null ? `${v}%` : '—' },
    { key: 'rainfall',   label: 'RAINFALL (MM)',      render: v => fmtNum(v) },
    { key: 'wind_speed', label: 'WIND SPEED (KM/H)', render: v => fmtNum(v) },
    { key: 'pressure',   label: 'PRESSURE (HPA)',    render: v => fmtNum(v, 1) },
  ],
  quality: [
    { key: 'timestamp',        label: 'TIME',            render: v => fmtTime(v) },
    { key: 'recommended_fish', label: 'RECOMMENDED FISH',render: v => v ?? '—' },
    { key: 'confidence',       label: 'CONFIDENCE',      render: v => v != null ? `${(v*100).toFixed(1)}%` : '—' },
    { key: 'water_quality',    label: 'WATER QUALITY',   render: v => <StatusBadge v={v} />, sortable: false },
    { key: 'habitat_status',   label: 'HABITAT',         render: v => <StatusBadge v={v} />, sortable: false },
  ],
  habitat: [
    { key: 'timestamp',        label: 'TIME',            render: v => fmtTime(v) },
    { key: 'habitat_status',   label: 'HABITAT STATUS',  render: v => <StatusBadge v={v} />, sortable: false },
    { key: 'recommended_fish', label: 'FISH',            render: v => v ?? '—' },
    { key: 'confidence',       label: 'SUITABILITY',     render: v => v != null ? `${(v*100).toFixed(1)}%` : '—' },
    { key: 'water_quality',    label: 'WATER QUALITY',   render: v => <StatusBadge v={v} />, sortable: false },
  ],
  xai: [
    { key: 'timestamp',        label: 'TIME',            render: v => fmtTime(v) },
    { key: 'recommended_fish', label: 'PREDICTION',      render: v => v ?? '—' },
    { key: 'ph_shap',          label: 'pH SHAP',         render: v => v != null ? Number(v).toFixed(4) : '—' },
    { key: 'temp_shap',        label: 'TEMP SHAP',       render: v => v != null ? Number(v).toFixed(4) : '—' },
    { key: 'turbidity_shap',   label: 'TURBIDITY SHAP',  render: v => v != null ? Number(v).toFixed(4) : '—' },
    { key: 'confidence',       label: 'CONFIDENCE',      render: v => v != null ? `${(v*100).toFixed(1)}%` : '—' },
  ],
  feeding: [
    { key: 'timestamp', label: 'TIME',            render: v => fmtTime(v) },
    { key: 'mode',      label: 'MODE',            render: v => v ?? '—' },
    { key: 'status',    label: 'STATUS',          render: v => <StatusBadge v={v ?? 'COMPLETED'} />, sortable: false },
    { key: 'duration',  label: 'DURATION (SEC)',  render: v => v ?? '—' },
    { key: 'reason',    label: 'REASON',          sortable: false,
      render: v => <span style={{ fontSize: 12, color: '#8b949e' }}>{v ?? '—'}</span> },
  ],
};

/* ── Flatten XAI from prediction history ── */
function flattenXAI(predictions) {
  return predictions.map(p => {
    const xai = p.xai_explanation ?? {};
    return {
      timestamp:        p.timestamp,
      recommended_fish: p.recommended_fish,
      confidence:       p.confidence,
      ph_shap:          xai.ph        ?? xai.shap_values?.ph        ?? null,
      temp_shap:        xai.temperature?? xai.shap_values?.temperature ?? null,
      turbidity_shap:   xai.turbidity  ?? xai.shap_values?.turbidity  ?? null,
    };
  });
}

/* ── Search filter ── */
function filterRows(rows, query) {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter(r =>
    Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
  );
}

/* ── Data fetcher hook ── */
function useFetch(tab, hours) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [lastUpd, setLastUpd] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let raw;

      if (tab === 'water') {
        // GET /api/history → { hours, count, data: [...] }
        raw = await api.getHistory(hours);
        setData(Array.isArray(raw) ? raw : (raw?.data ?? []));

      } else if (tab === 'weather') {
        // Weather is embedded in dashboard response: { sensor, weather }
        // For a table we call dashboard once and wrap weather in array
        const dash = await api.getDashboard();
        const w = dash?.weather;
        setData(w ? [{ ...w, timestamp: dash.last_updated }] : []);

      } else if (tab === 'quality' || tab === 'habitat' || tab === 'xai') {
        // GET /api/predict/history → { hours, count, data: [...] }
        raw = await api.getPredictions(hours);
        const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (tab === 'xai') {
          setData(flattenXAI(arr));
        } else {
          setData(arr);
        }

      } else if (tab === 'feeding') {
        // GET /api/feed/logs → { hours, count, data: [...] }
        raw = await api.getFeeding(hours);
        setData(Array.isArray(raw) ? raw : (raw?.data ?? []));
      }

      setLastUpd(format(new Date(), 'HH:mm:ss'));
    } catch (e) {
      setError(e.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, hours]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, lastUpd, reload: load };
}

/* ══════════════════════════════════════════════════════════ */
export default function DatabaseExplorer() {
  const [activeTab, setActiveTab] = useState('water');
  const [hours,     setHours]     = useState('24');
  const [search,    setSearch]    = useState('');

  const { data, loading, error, lastUpd, reload } = useFetch(activeTab, Number(hours));

  const handleTabChange = id => { setActiveTab(id); setSearch(''); };

  const filtered = useMemo(() => filterRows(data, search), [data, search]);

  const placeholders = {
    water:   'Search in Water Sensor Data…',
    weather: 'Search in Weather Data…',
    quality: 'Search in Predictions…',
    habitat: 'Search in Fish Habitat…',
    xai:     'Search in XAI Explanations…',
    feeding: 'Search in Feeding Logs…',
  };

  const timeLabel = { '1':'1h','6':'6h','24':'24h','72':'3d','168':'7d' }[hours] ?? '24h';

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `${activeTab}_${Date.now()}.json`,
    });
    a.click();
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <PageHeader
        title="Database Explorer"
        subtitle="Real-time IoT intelligence and Machine Learning monitoring"
        lastUpdated={lastUpd || undefined}
        onRefresh={reload}
        onExport={handleExport}
        rowCount={data.length}
        timeLabel={timeLabel}
      />

      <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />

      <div style={{ borderBottom: '1px solid #21262d' }}>
        <SearchBar
          placeholder={placeholders[activeTab]}
          value={search}
          onChange={setSearch}
          hours={hours}
          onHoursChange={v => setHours(v)}
        />
      </div>

      {error && (
        <div style={{
          margin: '12px 32px 0',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8, padding: '10px 14px', color: '#f85149', fontSize: 13,
        }}>
          ⚠ Could not load data: {error}
        </div>
      )}

      <div style={{ margin: '16px 32px 32px', background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
            <div style={{ marginBottom: 10, opacity: 0.4, letterSpacing: 6 }}>● ● ●</div>
            Fetching data…
          </div>
        ) : (
          <DataTable columns={COLUMNS[activeTab] ?? []} data={filtered} />
        )}
      </div>
    </div>
  );
}
