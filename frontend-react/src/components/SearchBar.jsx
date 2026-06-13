import { Search, Calendar, ChevronDown } from 'lucide-react';

const TIME_OPTIONS = [
  { value: '1',  label: 'Last 1 Hour'  },
  { value: '6',  label: 'Last 6 Hours' },
  { value: '24', label: 'Last 24 Hours'},
  { value: '72', label: 'Last 3 Days'  },
  { value: '168',label: 'Last 7 Days'  },
];

export default function SearchBar({ placeholder, value, onChange, hours, onHoursChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '16px 32px',
    }}>
      {/* Search input */}
      <div style={{ position: 'relative', flex: '0 0 280px' }}>
        <Search size={14} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: '#8b949e', pointerEvents: 'none',
        }} />
        <input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingLeft: 30, width: '100%' }}
        />
      </div>

      {/* Time range selector */}
      <div style={{ position: 'relative' }}>
        <Calendar size={13} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: '#8b949e', pointerEvents: 'none', zIndex: 1,
        }} />
        <ChevronDown size={13} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          color: '#8b949e', pointerEvents: 'none', zIndex: 1,
        }} />
        <select
          value={hours}
          onChange={e => onHoursChange(e.target.value)}
          style={{ paddingLeft: 28, paddingRight: 32, minWidth: 150 }}
        >
          {TIME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
