// Layout - Sidebar + Main content wrapper
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import deeplixMark from '../../assets/deeplix-Logo.png';

const NAV = [
  { to: '/dashboard', icon: '◉', label: 'Dashboard' },
  { to: '/chat', icon: '◈', label: 'AI Assistant' },
  { to: '/tasks', icon: '◫', label: 'Tasks' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { toggle, isDark } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/auth'); };

  const sidebarContent = (
    <aside style={{
      width: collapsed ? 68 : 240, minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--bg-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width var(--transition-base)',
      overflow: 'hidden', flexShrink: 0,
      position: 'relative', zIndex: 10
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '1.25rem 0' : '1.25rem 1.25rem',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--bg-border)'
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow-sm)', flexShrink: 0,
              overflow: 'hidden'
            }}>
              <img src={deeplixMark} alt="Deeplix AI" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
              Deeplix AI
            </span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-sm)',
            overflow: 'hidden'
          }}>
            <img src={deeplixMark} alt="Deeplix AI" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '1rem', padding: 4,
            borderRadius: 6, transition: 'all var(--transition-fast)',
            display: 'flex', alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ‹
          </button>
        )}
        {collapsed && (
          <div/>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '1rem', padding: '0.5rem',
            borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'center',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >›</button>
        )}

        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 10, padding: collapsed ? '0.65rem' : '0.65rem 0.875rem',
              borderRadius: 10, marginBottom: 4,
              background: isActive ? 'var(--accent-primary-glow)' : 'transparent',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
              border: `1px solid ${isActive ? 'rgba(124,106,247,0.2)' : 'transparent'}`,
              justifyContent: collapsed ? 'center' : 'flex-start',
              whiteSpace: 'nowrap', overflow: 'hidden'
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.style.background.includes('glow')) {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              // Reset handled by NavLink active state
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--bg-border)' }}>
        {/* Theme toggle */}
        <button onClick={toggle} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 10, padding: collapsed ? '0.6rem' : '0.6rem 0.875rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', borderRadius: 10, marginBottom: 4,
          fontSize: '0.85rem', justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'all var(--transition-fast)', fontFamily: 'var(--font-body)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <span style={{ fontSize: '1rem' }}>{isDark ? '☀' : '🌙'}</span>
          {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {/* User info + logout */}
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0.6rem 0.875rem',
            background: 'var(--bg-elevated)', borderRadius: 10, marginTop: 4
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: 'white'
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', padding: 2,
              borderRadius: 4, transition: 'color var(--transition-fast)',
              flexShrink: 0
            }}
            title="Sign out"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ⏻
            </button>
          </div>
        )}

        {collapsed && (
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '0.6rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', borderRadius: 10, fontSize: '1rem',
            transition: 'all var(--transition-fast)', fontFamily: 'var(--font-body)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--accent-red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >⏻</button>
        )}
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="sidebar-desktop">
        {sidebarContent}
      </div>
      <div className="sidebar-show">
        {sidebarContent}
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>

      <style>{`
        .sidebar-show { display: flex; }
        @media (max-width: 768px) {
          .sidebar-show { display: none; }
        }
      `}</style>
    </div>
  );
}
