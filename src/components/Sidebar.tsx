'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'tasks',
    label: 'My Tasks',
    href: '/tasks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// NavContent — extracted as a top-level component to satisfy React lint rules
// ---------------------------------------------------------------------------
interface NavContentProps {
  pathname: string;
  onNavClick: () => void;
}

function NavContent({ pathname, onNavClick }: NavContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Task<span style={{ color: 'var(--accent-blue-light)' }}>Flow</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              id={`nav-${item.id}`}
              href={item.href}
              onClick={onNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium relative"
              style={{
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: 'var(--accent-blue)' }}
                />
              )}
              <span style={{ color: isActive ? 'var(--accent-blue-light)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User avatar */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>Alex Kim</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>alex@taskflow.io</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — the exported shell handling responsive state
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          Task<span style={{ color: 'var(--accent-blue-light)' }}>Flow</span>
        </span>
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 z-40 flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <NavContent pathname={pathname} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <NavContent pathname={pathname} onNavClick={() => {}} />
      </aside>
    </>
  );
}
