import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';
import { SAMPLE_PROJECTS } from '@/lib/data';

export const metadata: Metadata = { title: 'Projects — TaskFlow' };

export default function ProjectsPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 overflow-y-auto">
        <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{SAMPLE_PROJECTS.length} active projects</p>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_PROJECTS.map((project) => {
            const pct = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
            return (
              <div
                key={project.id}
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color }} />
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{project.name}</h2>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    <span>{project.completedCount}/{project.taskCount} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-hover)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: project.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
