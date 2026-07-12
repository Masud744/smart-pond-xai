import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Sparkles, Fish,
  Bell, Database, Settings, Droplets, Wifi, WifiOff, ShieldCheck,
  Menu, X
} from 'lucide-react';
import UnderwaterBackground from './UnderwaterBackground';

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
  const [connectionOk, setConnectionOk] = useState(true);
  const [checking, setChecking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Periodic health check of API base
  useEffect(() => {
    async function checkHealth() {
      setChecking(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/status');
        if (res.ok) setConnectionOk(true);
        else setConnectionOk(false);
      } catch (e) {
        setConnectionOk(false);
      } finally {
        setChecking(false);
      }
    }
    checkHealth();
    const id = setInterval(checkHealth, 20000);
    return () => clearInterval(id);
  }, []);

  const activePageLabel = NAV.find(item => {
    if (item.to === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.to);
  })?.label ?? 'Dashboard';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Page-wide animated underwater background */}
      <UnderwaterBackground />
      {/* ── Mobile Backdrop ── */}
      <div
        className={`responsive-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside
        className={`responsive-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          width: 260, flexShrink: 0,
          background: 'rgba(13, 18, 34, 0.85)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column',
          padding: '24px 16px',
          position: 'sticky', top: 0, height: '100vh',
          overflowY: 'auto',
          zIndex: 1001,
        }}
      >
        {/* Logo area */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '4px 6px 24px',
          borderBottom: '1px solid var(--border-color)', marginBottom: 20,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-violet) 0%, var(--color-blue) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
            flexShrink: 0,
          }}>
            <Droplets size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'block' }}>
              Smart Pond XAI
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Precision IoT
            </span>
          </div>
          
          {/* Close button inside sidebar for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-only"
            style={{
              marginLeft: 'auto',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} style={{ flexShrink: 0, opacity: 0.85 }} />
              <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* System Diagnostics Indicator & Pond Badge */}
        <div style={{
          marginTop: 'auto', paddingTop: 20,
          borderTop: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Connection Status widget */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(7, 10, 19, 0.4)',
            border: '1px solid var(--border-color)',
            fontSize: 11, fontWeight: 600,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
              {connectionOk ? (
                <Wifi size={14} color="var(--color-emerald)" />
              ) : (
                <WifiOff size={14} color="var(--color-rose)" />
              )}
              <span>{connectionOk ? 'IoT Cloud Connected' : 'Host Offline'}</span>
            </div>
            <span className={connectionOk ? 'pulse-dot' : ''} style={{ background: connectionOk ? 'var(--color-emerald)' : 'var(--color-rose)' }} />
          </div>

          {/* Pond Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-blue) 0%, var(--color-cyan) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.2)',
            }}>P1</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Main Pond
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                ID: pond_01
              </div>
            </div>
            <ShieldCheck size={16} color="var(--color-emerald)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        
        {/* ── Mobile top header ── */}
        <header
          className="mobile-only"
          style={{
            height: 60,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            alignItems: 'center',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            justifyContent: 'space-between',
            display: 'none', // Overridden by media query to show
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {activePageLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
            <span>P1</span>
          </div>
        </header>

        {/* Dynamic page key forces animation transition on path changes */}
        <div key={location.pathname} className="page-fade-in" style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
