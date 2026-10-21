import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings — TaskFlow' };

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your account preferences</p>
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-center space-y-2">
            <svg className="mx-auto" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <p className="text-sm font-medium">Settings — coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
