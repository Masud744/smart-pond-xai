import { useState } from 'react';
import { Settings as SettingsIcon, Save, Server, Bell, Eye, RefreshCw } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={15} color="#58a6ff" />
      <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{title}</span>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c9d1d9', marginBottom: 6 }}>{label}</label>
    {children}
    {hint && <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>{hint}</div>}
  </div>
);

const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(48,54,61,0.5)' }}>
    <span style={{ fontSize: 13, color: '#c9d1d9' }}>{label}</span>
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 22, borderRadius: 11, cursor: 'pointer',
        background: value ? '#238636' : '#30363d',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  </div>
);

export default function Settings() {
  const [apiUrl,      setApiUrl]      = useState('https://pond-management-backend.onrender.com/api');
  const [refreshInt,  setRefreshInt]  = useState('30');
  const [alertEmail,  setAlertEmail]  = useState('');
  const [tempMin,     setTempMin]     = useState('20');
  const [tempMax,     setTempMax]     = useState('32');
  const [phMin,       setPhMin]       = useState('6.5');
  const [phMax,       setPhMax]       = useState('8.5');
  const [turbMax,     setTurbMax]     = useState('50');
  const [darkMode,    setDarkMode]    = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [liveSync,    setLiveSync]    = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [saved,       setSaved]       = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    width: '100%', background: '#0d1117', border: '1px solid #30363d',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#e6edf3', outline: 'none',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon size={22} color="#8b949e" /> Settings
          </h1>
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>Configure API, thresholds, and UI preferences</p>
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          style={{ background: saved ? 'rgba(63,185,80,0.15)' : undefined, borderColor: saved ? 'rgba(63,185,80,0.4)' : undefined, color: saved ? '#3fb950' : undefined }}
        >
          <Save size={13} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* API Config */}
      <Section title="API Configuration" icon={Server}>
        <Field label="Backend API URL" hint="The base URL for your pond management backend">
          <input style={inputStyle} value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
        </Field>
        <Field label="Auto-refresh Interval (seconds)" hint="How often to fetch new data (minimum 10s)">
          <input style={{ ...inputStyle, maxWidth: 160 }} type="number" min="10" max="300" value={refreshInt} onChange={e => setRefreshInt(e.target.value)} />
        </Field>
      </Section>

      {/* Alert Thresholds */}
      <Section title="Alert Thresholds" icon={Bell}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Min Temperature (°C)">
            <input style={inputStyle} type="number" value={tempMin} onChange={e => setTempMin(e.target.value)} />
          </Field>
          <Field label="Max Temperature (°C)">
            <input style={inputStyle} type="number" value={tempMax} onChange={e => setTempMax(e.target.value)} />
          </Field>
          <Field label="Min pH Level">
            <input style={inputStyle} type="number" step="0.1" value={phMin} onChange={e => setPhMin(e.target.value)} />
          </Field>
          <Field label="Max pH Level">
            <input style={inputStyle} type="number" step="0.1" value={phMax} onChange={e => setPhMax(e.target.value)} />
          </Field>
          <Field label="Max Turbidity (%)">
            <input style={inputStyle} type="number" value={turbMax} onChange={e => setTurbMax(e.target.value)} />
          </Field>
          <Field label="Alert Email" hint="Leave blank to disable email alerts">
            <input style={inputStyle} type="email" placeholder="alerts@example.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Display Preferences */}
      <Section title="Display Preferences" icon={Eye}>
        <Toggle value={darkMode}    onChange={setDarkMode}    label="Dark Mode" />
        <Toggle value={compactView} onChange={setCompactView} label="Compact Table View" />
        <Toggle value={liveSync}    onChange={setLiveSync}    label="Live Sync Indicator" />
        <Toggle value={emailAlerts} onChange={setEmailAlerts} label="Email Notifications" />
      </Section>

      {/* Pond Info */}
      <Section title="Pond Information" icon={RefreshCw}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Pond Name">
            <input style={inputStyle} defaultValue="Main Pond" />
          </Field>
          <Field label="Pond ID">
            <input style={inputStyle} defaultValue="pond_01" readOnly />
          </Field>
          <Field label="Volume (m³)">
            <input style={inputStyle} type="number" defaultValue="500" />
          </Field>
          <Field label="Fish Species">
            <input style={inputStyle} defaultValue="Tilapia" />
          </Field>
        </div>
      </Section>
    </div>
  );
}
