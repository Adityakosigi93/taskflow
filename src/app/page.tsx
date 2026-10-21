import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import AuthGate from '@/components/AuthGate';

export default function Home() {
  return (
    <AuthGate>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 overflow-hidden">
          <Dashboard />
        </div>
      </div>
    </AuthGate>
  );
}
