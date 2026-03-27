'use client';
// src/components/Sidebar.tsx — Navigation sidebar with active state and responsive drawer
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Play, History, ListChecks } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/run',       label: 'New run',      Icon: Play },
  { href: '/history',   label: 'History',      Icon: History },
  { href: '/tasks',     label: 'Tasks',        Icon: ListChecks },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then((res) => res.json())
      .then((data) => {
        setModelName(data?.model ?? 'unknown');
        setConnected(true);
      })
      .catch(() => {
        setConnected(false);
      });
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  const navContent = (
    <nav aria-label="Main navigation" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '0.5px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--accent-light)', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          PromptForge
        </span>
      </div>

      {/* Links */}
      <ul role="list" style={{ listStyle: 'none', margin: 0, padding: '0.75rem 0' }}>
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className="sidebar-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 1.25rem',
                  paddingLeft: active ? '1.125rem' : '1.25rem',
                  margin: '0.25rem 0.625rem',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-card-hover)' : 'transparent',
                  borderLeft: active ? '3px solid var(--accent-light)' : '3px solid transparent',
                  transition: 'var(--transition-smooth)',
                  boxShadow: active ? 'inset 20px 0 30px -20px rgba(167, 139, 250, 0.2)' : 'none',
                }}
              >
                <Icon size={18} aria-hidden="true" style={{ color: active ? 'var(--accent-light)' : 'inherit', transition: 'var(--transition-smooth)' }} />
                <span style={{ 
                  textShadow: active ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none'
                }}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <style>{`
        .sidebar-link:hover {
          background: var(--bg-card) !important;
          color: #fff !important;
          transform: translateX(2px);
        }
      `}</style>

      {/* Model indicator pill */}
      <div style={{ marginTop: 'auto', padding: '1rem 1.25rem' }}>
        {connected === null ? null : connected ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            <span className="pulse-dot" style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#16a34a',
              flexShrink: 0,
            }} />
            {modelName}
          </div>
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: '#dc2626',
          }}>
            disconnected
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — hidden below 768px */}
      <aside
        aria-label="Sidebar"
        style={{
          width: '240px',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="sidebar-desktop"
      >
        {navContent}
      </aside>

      {/* Mobile: hamburger button */}
      <button
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="sidebar-drawer"
        onClick={() => setOpen(true)}
        className="sidebar-menu-btn"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 50,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text)',
          padding: '0.5rem',
          cursor: 'pointer',
          lineHeight: 1,
          fontSize: '1.25rem',
        }}
      >
        ☰
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          role="presentation"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        id="sidebar-drawer"
        aria-label="Sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: '240px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
        className="sidebar-drawer"
      >
        <button
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        {navContent}
      </aside>

      <style>{`
        .sidebar-desktop { display: flex; }
        .sidebar-menu-btn { display: none; }
        .sidebar-drawer { display: none; }

        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-menu-btn { display: block; }
          .sidebar-drawer { display: flex; flex-direction: column; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
