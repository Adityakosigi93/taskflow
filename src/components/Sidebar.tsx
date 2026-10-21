
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
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0l.06.06a2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

interface NavContentProps {
  pathname: string;
  onNavClick: () => void;
}

function NavContent({ pathname, onNavClick }: NavContentProps) {
  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        onClick={onNavClick}
        className="group flex items-center gap-3 border-b px-4 py-5 transition-colors duration-200 hover:bg-white/[0.03]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
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
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p
          className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
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
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? 'shadow-sm'
                  : 'hover:bg-white/[0.05]'
              }`}
              style={{
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : undefined,
                color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
              }}
            >
              {/* Active indicator */}
              <span
                className={`absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'w-1 opacity-100'
                    : 'w-0 opacity-0 group-hover:w-1 group-hover:opacity-70'
                }`}
                style={{ background: 'var(--accent-blue)' }}
              />

              {/* Icon */}
              <span
                className="transition-transform duration-200 group-hover:scale-110"
                style={{
                  color: isActive ? 'var(--accent-blue-light)' : 'var(--text-muted)',
                }}
              >
                {item.icon}
              </span>

              <span className="transition-colors duration-200">
                {item.label}
              </span>

              {/* Active dot */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User avatar */}
      <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="group flex cursor-default items-center gap-3 rounded-xl p-2 -mx-2 transition-colors duration-200 hover:bg-white/[0.04]">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-transform duration-200 group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Alex Kim
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              alex@taskflow.io
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between px-4 lg:hidden"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          href="/"
          className="text-base font-bold transition-opacity duration-200 hover:opacity-80"
          style={{ color: 'var(--text-primary)' }}
        >
          Task<span style={{ color: 'var(--accent-blue-light)' }}>Flow</span>
        </Link>

        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:bg-white/[0.07] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
          aria-expanded={mobileOpen}
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
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        id="mobile-sidebar"
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
        aria-label="Mobile navigation"
      >
        <NavContent pathname={pathname} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col lg:flex"
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
        aria-label="Main navigation"
      >
        <NavContent pathname={pathname} onNavClick={() => {}} />
      </aside>
    </>
  );
}
