import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import { SAMPLE_TASKS } from '@/lib/data';

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      {/* Push content right on desktop; add top padding on mobile for the fixed header */}
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 overflow-hidden">
        <Dashboard initialTasks={SAMPLE_TASKS} />
      </div>
    </div>
  );
}
