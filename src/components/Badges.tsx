import { Priority, Status } from '@/lib/types';

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; bg: string; text: string }> = {
  Low: { label: 'Low', dot: '#64748b', bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
  Medium: { label: 'Medium', dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  High: { label: 'High', dot: '#3b82f6', bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  Critical: { label: 'Critical', dot: '#ef4444', bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
};

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string }> = {
  'Todo': { label: 'Todo', bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  'In Progress': { label: 'In Progress', bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  'Completed': { label: 'Completed', bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  'Overdue': { label: 'Overdue', bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}
