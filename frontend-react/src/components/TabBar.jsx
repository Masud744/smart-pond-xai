import { Database } from 'lucide-react';

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, flexWrap: 'wrap',
      padding: '16px 32px 0',
      borderBottom: '1px solid #21262d',
      marginBottom: 0,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <Database size={13} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
