import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Sparkles, Fish,
  Bell, Database, Settings, Droplets
} from 'lucide-react';

const NAV = [
  { to: '/',               label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/analytics',      label: 'Analytics',      icon: TrendingUp       },
  { to: '/xai-predictions',label: 'XAI Predictions',icon: Sparkles         },
  { to: '/fish-feeding',   label: 'Fish Feeding',   icon: Fish             },
  { to: '/alerts',         label: 'Alerts Logs',    icon: Bell             },
  { to: '/database',       label: 'Database Explorer', icon: Database      },
  { to: '/settings',       label: 'Settings',       icon: Settings         },
];

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 224, flexShrink: 0,
        background: '#161b22',
        borderRight: '1px solid #21262d',
        display: 'flex', flexDirection: 'column',
        padding: '20px 12px',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '4px 6px 20px',
          borderBottom: '1px solid #21262d', marginBottom: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Droplets size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e6edf3', letterSpacing: '-0.01em' }}>
            Smart Pond XAI
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Pond badge at bottom */}
        <div style={{
          marginTop: 'auto', paddingTop: 16,
          borderTop: '1px solid #21262d',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            background: '#1c2333',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>P1</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Main Pond</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>ID: pond_01</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
