import { RefreshCw, Download } from 'lucide-react';

export default function PageHeader({ title, subtitle, lastUpdated, onRefresh, rowCount, timeLabel = '24h', onExport }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '28px 32px 0',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
            <span className="pulse-dot" />
            <span>Live Syncing</span>
            <span style={{ color: '#484f58' }}>|</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
        )}
        {onExport && (
          <button className="btn-ghost" onClick={onExport}>
            <Download size={13} /> Export
          </button>
        )}
        {onRefresh && (
          <button className="btn-ghost" onClick={onRefresh}>
            <RefreshCw size={13} /> Refresh
          </button>
        )}
        {rowCount != null && (
          <div style={{
            padding: '6px 12px',
            background: '#1c2333',
            border: '1px solid #30363d',
            borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            color: '#8b949e',
          }}>
            {rowCount} rows ({timeLabel})
          </div>
        )}
      </div>
    </div>
  );
}
