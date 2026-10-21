import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import AuthGate from '@/components/AuthGate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Tasks — TaskFlow',
};

export default function TasksPage() {
  return (
    <AuthGate>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0 overflow-hidden">
          <Dashboard />
        </div>
      </div>
    </AuthGate>
  );
}