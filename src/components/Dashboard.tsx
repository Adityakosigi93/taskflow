'use client';

import { useState, useMemo, useEffect } from 'react';
import { Task, Status } from '@/lib/types';
import { PriorityBadge, StatusBadge } from './Badges';
import CreateTaskModal from './CreateTaskModal';
import { SAMPLE_PROJECTS } from '@/lib/data';

interface SummaryCard {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

interface DashboardProps {
  initialTasks: Task[];
}

const ALL_STATUS = 'All';
const STATUS_FILTERS: (Status | typeof ALL_STATUS)[] = [ALL_STATUS, 'Todo', 'In Progress', 'Completed', 'Overdue'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr: string, status: Status, todayStr: string) {
  if (status === 'Completed') return false;
  return dateStr < todayStr;
}

export default function Dashboard({ initialTasks }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | typeof ALL_STATUS>(ALL_STATUS);
  const [modalOpen, setModalOpen] = useState(false);

  // Read the current date after mounting to keep server and client renders consistent.
  const [today, setToday] = useState<{ str: string; label: string } | null>(null);

  useEffect(() => {
    // Defer the state update until after the effect finishes. This keeps the
    // initial server/client render consistent and avoids a synchronous effect update.
    const timeoutId = window.setTimeout(() => {
      const now = new Date();
      const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      setToday({
        str,
        label: now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const projectNames = useMemo(() => SAMPLE_PROJECTS.map((p) => p.name), []);

  // Summary counts
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const overdue = tasks.filter((t) => t.status === 'Overdue').length;

  const summaryCards: SummaryCard[] = [
    {
      id: 'card-total',
      label: 'Total Tasks',
      value: total,
      gradient: 'linear-gradient(135deg, #1e3a5f, #1e3a5f)',
      iconBg: 'rgba(59,130,246,0.2)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      ),
    },
    {
      id: 'card-in-progress',
      label: 'In Progress',
      value: inProgress,
      gradient: 'linear-gradient(135deg, #1e2d5f, #1e2d5f)',
      iconBg: 'rgba(139,92,246,0.2)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'card-completed',
      label: 'Completed',
      value: completed,
      gradient: 'linear-gradient(135deg, #0d3d2e, #0d3d2e)',
      iconBg: 'rgba(16,185,129,0.2)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'card-overdue',
      label: 'Overdue',
      value: overdue,
      gradient: 'linear-gradient(135deg, #3d1515, #3d1515)',
      iconBg: 'rgba(239,68,68,0.2)',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.project.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === ALL_STATUS || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  function handleAddTask(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {today?.label ?? <span aria-hidden="true">&nbsp;</span>}
          </p>
        </div>
        <button
          id="create-task-btn"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">New Task</span>
          <span className="sm:hidden">New</span>
        </button>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Summary Cards */}
        <section aria-label="Summary statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.id}
                id={card.id}
                className="rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: card.iconBg }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Progress bar */}
        <section
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          aria-label="Overall progress"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overall Progress</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{completed} of {total} tasks completed</p>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--accent-blue-light)' }}>{completionPct}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--bg-hover)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
            />
          </div>
        </section>

        {/* Task Table Section */}
        <section aria-label="Task list">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                id="task-search-input"
                type="search"
                placeholder="Search tasks, projects, assignees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Status filters */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  id={`filter-${s.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: statusFilter === s ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                    color: statusFilter === s ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                    border: `1px solid ${statusFilter === s ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Task</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Project</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Due Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                        <div className="flex flex-col items-center gap-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                          </svg>
                          <span className="text-sm">No tasks found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, i) => {
                      const overdueMark = today ? isOverdue(task.dueDate, task.status, today.str) : false;
                      const isLast = i === filteredTasks.length - 1;
                      return (
                        <tr
                          key={task.id}
                          className="group"
                          style={{
                            background: 'var(--bg-card)',
                            borderBottom: isLast ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          <td className="px-5 py-3.5">
                            <p
                              className="font-medium max-w-[220px] truncate"
                              style={{ color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}
                              title={task.title}
                            >
                              {task.status === 'Completed' ? <s>{task.title}</s> : task.title}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                              {task.project}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="text-xs font-medium"
                              style={{ color: overdueMark ? 'var(--accent-red)' : 'var(--text-secondary)' }}
                            >
                              {formatDate(task.dueDate)}
                              {overdueMark && ' ⚠'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                              >
                                {task.assignee[0]}
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task.assignee}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">No tasks found</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const overdueMark = today ? isOverdue(task.dueDate, task.status, today.str) : false;
                  return (
                    <div key={task.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="font-medium text-sm leading-snug"
                          style={{ color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}
                        >
                          {task.status === 'Completed' ? <s>{task.title}</s> : task.title}
                        </p>
                        <StatusBadge status={task.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                          {task.project}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                          >
                            {task.assignee[0]}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task.assignee}</span>
                        </div>
                        <span className="text-xs" style={{ color: overdueMark ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                          Due {formatDate(task.dueDate)}{overdueMark && ' ⚠'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Table footer */}
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTask}
        projects={projectNames}
      />
    </div>
  );
}
