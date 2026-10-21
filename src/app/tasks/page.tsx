import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Tasks — TaskFlow' };

export default function TasksPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>My Tasks</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All tasks assigned to you</p>
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-center space-y-2">
            <svg className="mx-auto" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <p className="text-sm font-medium">My Tasks — coming soon</p>
            <p className="text-xs">Go to <Link href="/" className="underline" style={{ color: 'var(--accent-blue-light)' }}>Dashboard</Link> to manage tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
