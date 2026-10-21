'use client';

import { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCorners, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task, Status, Priority } from '@/lib/types';
import { PriorityBadge } from './Badges';
import CreateTaskModal from './CreateTaskModal';
import { SAMPLE_PROJECTS } from '@/lib/data';
import { supabase } from '@/lib/supabase';

interface SummaryCard {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

const ALL_STATUS = 'All';
const STATUS_FILTERS: (Status | typeof ALL_STATUS)[] = [ALL_STATUS, 'Todo', 'In Progress', 'Completed', 'Overdue'];
const BOARD_STATUSES: Status[] = ['Todo', 'In Progress', 'Completed', 'Overdue'];
const PRIORITY_FILTERS: (Priority | typeof ALL_STATUS)[] = [ALL_STATUS, 'Critical', 'High', 'Medium', 'Low'];
type SortOption = 'due-asc' | 'priority-desc' | 'newest' | 'title-asc';
type DueFilter = 'all' | 'overdue' | 'today' | 'next7';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr: string, status: Status, todayStr: string) {
  if (status === 'Completed') return false;
  return dateStr < todayStr;
}


interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
}

function KanbanColumn({ status, tasks, onEdit, onDelete, onDuplicate }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const accent: Record<Status, string> = {
    Todo: '#60a5fa',
    'In Progress': '#a78bfa',
    Completed: '#34d399',
    Overdue: '#f87171',
  };

  return (
    <section
      ref={setNodeRef}
      aria-label={`${status} tasks`}
      className="min-w-[260px] flex-1 rounded-2xl border p-3 transition-colors duration-150"
      style={{
        background: isOver ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)',
        borderColor: isOver ? 'rgba(96,165,250,0.65)' : 'var(--border)',
      }}
    >
      <div className="mb-3 flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent[status] }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{status}</h3>
        </div>
        <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
          {tasks.length}
        </span>
      </div>
      <div className="min-h-[160px] space-y-3">
        {tasks.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Drop tasks here
          </div>
        ) : tasks.map((task) => (
          <KanbanTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
        ))}
      </div>
    </section>
  );
}

interface KanbanTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
}

function KanbanTaskCard({ task, onEdit, onDelete, onDuplicate }: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="rounded-xl p-3 transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag task ${task.title}`}
          title="Drag to change status"
          className="min-w-0 flex-1 cursor-grab text-left text-sm font-semibold leading-5 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{ color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)', touchAction: 'none' }}
        >
          {task.status === 'Completed' ? <s>{task.title}</s> : task.title}
        </button>
        <span aria-hidden="true" className="text-base leading-none" style={{ color: 'var(--text-muted)' }}>⠿</span>
      </div>
      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="max-w-full truncate rounded-md px-2 py-1 text-[11px]" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{task.project}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            {task.assignee?.[0]?.toUpperCase() ?? '?'}
          </span>
          <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{task.assignee}</span>
        </div>
        <span className="flex-shrink-0 text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(task.dueDate)}</span>
      </div>
      <div className="mt-3 flex justify-end gap-1 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
        <button type="button" onClick={() => onDuplicate(task)} title={`Duplicate ${task.title}`} className="rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-violet-500/10 hover:text-violet-300" style={{ color: 'var(--text-muted)' }}>Duplicate</button>
        <button type="button" onClick={() => onEdit(task)} className="rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-blue-500/10 hover:text-blue-400" style={{ color: 'var(--text-muted)' }}>Edit</button>
        <button type="button" onClick={() => onDelete(task)} className="rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-red-500/10 hover:text-red-400" style={{ color: 'var(--text-muted)' }}>Delete</button>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [dbError, setDbError] = useState('');
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | typeof ALL_STATUS>(ALL_STATUS);
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof ALL_STATUS>(ALL_STATUS);
  const [projectFilter, setProjectFilter] = useState<string>(ALL_STATUS);
  const [sortBy, setSortBy] = useState<SortOption>('due-asc');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [modalOpen, setModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  // Keyboard shortcuts: N creates a task, / focuses search, and Escape closes overlays.
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (taskToDelete && !deletingTaskId) setTaskToDelete(null);
        else if (modalOpen) {
          setModalOpen(false);
          setTaskToEdit(null);
        }
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      );
      if (isTyping) return;

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setTaskToEdit(null);
        setModalOpen(true);
      } else if (event.key === '/') {
        event.preventDefault();
        document.getElementById('task-search-input')?.focus();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [modalOpen, taskToDelete, deletingTaskId]);

  function showToast(message: string, kind: 'success' | 'error' = 'success') {
    setToast({ message, kind });
  }

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

  // Load only the signed-in user's tasks from Supabase. Row Level Security
  // also enforces this restriction on the database side.
  useEffect(() => {
    let active = true;

    async function loadTasks() {
      setLoadingTasks(true);
      setDbError('');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (active) {
          setDbError(userError?.message ?? 'Please sign in again to load your tasks.');
          setLoadingTasks(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, priority, status, project, assignee, due_date, created_at')
        .order('created_at', { ascending: false });

      if (!active) return;

      if (error) {
        setDbError(`Could not load tasks: ${error.message}`);
      } else {
        setTasks((data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description ?? '',
          priority: row.priority as Task['priority'],
          status: row.status as Task['status'],
          project: row.project,
          assignee: row.assignee,
          dueDate: row.due_date,
          createdAt: row.created_at,
        })));
      }
      setLoadingTasks(false);
    }

    loadTasks();
    return () => { active = false; };
  }, []);

  const projectNames = useMemo(
    () => Array.from(new Set([...SAMPLE_PROJECTS.map((p) => p.name), ...tasks.map((task) => task.project)])).sort((a, b) => a.localeCompare(b)),
    [tasks],
  );

  // Summary counts
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const overdue = tasks.filter((t) =>
    t.status === 'Overdue' || (!!today && isOverdue(t.dueDate, t.status, today.str))
  ).length;

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
    const priorityRank: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const result = tasks.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        t.title.toLowerCase().includes(q) ||
        t.project.toLowerCase().includes(q) ||
        (t.assignee ?? '').toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q);
      const matchStatus = statusFilter === ALL_STATUS || t.status === statusFilter;
      const matchPriority = priorityFilter === ALL_STATUS || t.priority === priorityFilter;
      const matchProject = projectFilter === ALL_STATUS || t.project === projectFilter;
      const next7 = today ? new Date(today.str + 'T00:00:00') : null;
      if (next7) next7.setDate(next7.getDate() + 7);
      const matchDue = dueFilter === 'all' || !today
        ? true
        : dueFilter === 'overdue'
          ? t.status !== 'Completed' && t.dueDate < today.str
          : dueFilter === 'today'
            ? t.dueDate === today.str
            : !!next7 && t.dueDate >= today.str && t.dueDate <= `${next7.getFullYear()}-${String(next7.getMonth() + 1).padStart(2, '0')}-${String(next7.getDate()).padStart(2, '0')}`;
      return matchSearch && matchStatus && matchPriority && matchDue && matchProject;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority-desc':
          return priorityRank[b.priority] - priorityRank[a.priority] ||
            a.dueDate.localeCompare(b.dueDate);
        case 'newest':
          return b.createdAt.localeCompare(a.createdAt);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'due-asc':
        default:
          return a.dueDate.localeCompare(b.dueDate);
      }
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortBy, dueFilter, projectFilter, today]);

  async function handleAddTask(task: Task): Promise<boolean> {
    setDbError('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setDbError(userError?.message ?? 'Please sign in again before creating a task.');
      showToast('Could not create task. Please sign in again.', 'error');
      return false;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title.trim(),
        description: task.description.trim() || null,
        priority: task.priority,
        status: task.status,
        project: task.project,
        assignee: task.assignee.trim(),
        due_date: task.dueDate,
        user_id: userData.user.id,
      })
      .select('id, title, description, priority, status, project, assignee, due_date, created_at')
      .single();

    if (error) {
      setDbError(`Could not save task: ${error.message}`);
      showToast('Task could not be saved.', 'error');
      return false;
    }

    const savedTask: Task = {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      priority: data.priority as Task['priority'],
      status: data.status as Task['status'],
      project: data.project,
      assignee: data.assignee,
      dueDate: data.due_date,
      createdAt: data.created_at,
    };
    setTasks((prev) => [savedTask, ...prev]);
    showToast('Task created successfully.');
    return true;
  }

  async function handleDuplicateTask(task: Task) {
    const copy: Task = {
      ...task,
      id: '',
      title: `${task.title} (Copy)`,
      status: 'Todo',
      createdAt: new Date().toISOString(),
    };
    await handleAddTask(copy);
  }

  async function handleUpdateTask(task: Task): Promise<boolean> {
    setDbError('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setDbError(userError?.message ?? 'Please sign in again before editing a task.');
      showToast('Could not edit task. Please sign in again.', 'error');
      return false;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title.trim(),
        description: task.description.trim() || null,
        priority: task.priority,
        status: task.status,
        project: task.project,
        assignee: task.assignee.trim(),
        due_date: task.dueDate,
      })
      .eq('id', task.id)
      .eq('user_id', userData.user.id)
      .select('id, title, description, priority, status, project, assignee, due_date, created_at')
      .single();

    if (error) {
      setDbError(`Could not update task: ${error.message}`);
      showToast('Task changes could not be saved.', 'error');
      return false;
    }

    const updatedTask: Task = {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      priority: data.priority as Task['priority'],
      status: data.status as Task['status'],
      project: data.project,
      assignee: data.assignee,
      dueDate: data.due_date,
      createdAt: data.created_at,
    };

    setTasks((prev) => prev.map((item) => item.id === updatedTask.id ? updatedTask : item));
    showToast('Task updated successfully.');
    return true;
  }

  async function handleStatusChange(taskId: string, status: Status) {
    setDbError('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setDbError(userError?.message ?? 'Please sign in again before changing a task status.');
      showToast('Could not change task status. Please sign in again.', 'error');
      return;
    }

    const previousTask = tasks.find((task) => task.id === taskId);
    if (!previousTask || previousTask.status === status) return;

    // Optimistically move the card, then restore it if Supabase rejects the update.
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status } : task));
    const { data: updatedRow, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .eq('user_id', userData.user.id)
      .select('id')
      .maybeSingle();

    if (error || !updatedRow) {
      // Restore the previous UI state if the database rejected the update
      // or the task no longer belongs to the signed-in user.
      setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status: previousTask.status } : task));
      const message = error?.message ?? 'Task not found or access denied.';
      setDbError(`Could not update task status: ${message}`);
      showToast('Status update failed. The task was restored.', 'error');
    } else {
      showToast(`Task moved to ${status}.`);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overData = over.data.current as { status?: Status } | undefined;
    const targetStatus = overData?.status ?? String(over.id).replace(/^column-/, '');
    if (!BOARD_STATUSES.includes(targetStatus as Status)) return;

    const task = tasks.find((item) => item.id === taskId);
    if (task && task.status !== targetStatus) {
      void handleStatusChange(taskId, targetStatus as Status);
    }
  }

  async function handleDeleteTask() {
    if (!taskToDelete || deletingTaskId) return;

    const taskId = taskToDelete.id;
    setDbError('');
    setDeletingTaskId(taskId);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setDbError(userError?.message ?? 'Please sign in again before deleting a task.');
      showToast('Could not delete task. Please sign in again.', 'error');
      setDeletingTaskId(null);
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userData.user.id);

    if (error) {
      setDbError(`Could not delete task: ${error.message}`);
      showToast('Task could not be deleted.', 'error');
      setDeletingTaskId(null);
      return;
    }

    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setTaskToDelete(null);
    setDeletingTaskId(null);
    showToast('Task deleted successfully.');
  }

  function handleExportTasks() {
    if (filteredTasks.length === 0) {
      showToast('No tasks to export with the current filters.', 'error');
      return;
    }

    const columns: { key: keyof Task; label: string }[] = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'project', label: 'Project' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'createdAt', label: 'Created At' },
    ];
    const escapeCsv = (value: unknown) => {
      let text = String(value ?? '');
      // Prevent spreadsheet formula execution for untrusted text fields.
      if (/^[\t\r ]*[=+@]/.test(text) || /^[\t\r ]*-/.test(text)) text = `'${text}`;
      return `\"${text.replace(/\"/g, '\"\"')}\"`;
    };
    const csv = [
      columns.map((column) => escapeCsv(column.label)).join(','),
      ...filteredTasks.map((task) => columns.map((column) => escapeCsv(task[column.key])).join(',')),
    ].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} to CSV.`);
  }

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {toast && (
        <div
          role={toast.kind === 'error' ? 'alert' : 'status'}
          aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
          className="fixed right-4 top-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl sm:right-6 sm:top-6"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: toast.kind === 'error' ? 'rgba(248,113,113,0.5)' : 'rgba(52,211,153,0.45)',
            color: toast.kind === 'error' ? '#fca5a5' : '#6ee7b7',
          }}
        >
          <span aria-hidden="true">{toast.kind === 'error' ? '!' : '✓'}</span>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="ml-2 rounded px-1 text-lg leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      )}
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportTasks}
            title={`Export ${filteredTasks.length} currently filtered task${filteredTasks.length === 1 ? '' : 's'} as CSV`}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-white/[0.04] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            id="create-task-btn"
            onClick={() => { setTaskToEdit(null); setModalOpen(true); }}
            className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        <p className="-mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Shortcuts: <kbd className="rounded border px-1.5 py-0.5 font-mono" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>N</kbd> new task <span className="mx-1">·</span> <kbd className="rounded border px-1.5 py-0.5 font-mono" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>/</kbd> search <span className="mx-1">·</span> <kbd className="rounded border px-1.5 py-0.5 font-mono" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>Esc</kbd> close dialog
        </p>
        {dbError && (
          <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-sm">
            {dbError}
          </div>
        )}
        {loadingTasks && (
          <div className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" aria-hidden="true" />
            Loading your tasks...
          </div>
        )}

        {/* Summary Cards */}
        <section aria-label="Summary statistics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.id}
                id={card.id}
                className="group flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg sm:p-5"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
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
          className="rounded-2xl border p-4 transition-colors duration-200 hover:border-slate-600 sm:p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
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
              className="h-2 rounded-full transition-all duration-700 ease-out"
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
                className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Project filter */}
            <select
              id="project-filter"
              aria-label="Filter tasks by project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="min-w-[145px] rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <option value={ALL_STATUS}>All projects</option>
              {projectNames.map((project) => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>

            {/* Priority, due-date and sorting controls */}
            <div className="flex flex-wrap gap-2">
              <select
                id="due-date-filter"
                aria-label="Filter tasks by due date"
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value as DueFilter)}
                className="min-w-[130px] rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <option value="all">All due dates</option>
                <option value="overdue">Overdue tasks</option>
                <option value="today">Due today</option>
                <option value="next7">Due in next 7 days</option>
              </select>
              <select
                id="priority-filter"
                aria-label="Filter tasks by priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | typeof ALL_STATUS)}
                className="min-w-[130px] rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {PRIORITY_FILTERS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority === ALL_STATUS ? 'All priorities' : `${priority} priority`}
                  </option>
                ))}
              </select>

              <select
                id="task-sort"
                aria-label="Sort tasks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="min-w-[145px] rounded-xl border px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <option value="due-asc">Due date: earliest</option>
                <option value="priority-desc">Priority: highest</option>
                <option value="newest">Newest first</option>
                <option value="title-asc">Title: A–Z</option>
              </select>
            </div>

            {/* View switch */}
            <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                aria-pressed={viewMode === 'board'}
                className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                style={{ background: viewMode === 'board' ? 'rgba(59,130,246,0.15)' : 'transparent', color: viewMode === 'board' ? 'var(--accent-blue-light)' : 'var(--text-secondary)' }}
              >Board</button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                style={{ background: viewMode === 'table' ? 'rgba(59,130,246,0.15)' : 'transparent', color: viewMode === 'table' ? 'var(--accent-blue-light)' : 'var(--text-secondary)' }}
              >Table</button>
            </div>

            {/* Status filters */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  id={`filter-${s.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className="rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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

          {(priorityFilter !== ALL_STATUS || projectFilter !== ALL_STATUS || sortBy !== 'due-asc' || dueFilter !== 'all' || statusFilter !== ALL_STATUS || search.trim() !== '') && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {filteredTasks.length} matching task{filteredTasks.length === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter(ALL_STATUS);
                  setPriorityFilter(ALL_STATUS);
                  setProjectFilter(ALL_STATUS);
                  setSortBy('due-asc');
                  setDueFilter('all');
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ color: 'var(--accent-blue-light)' }}
              >
                Reset filters
              </button>
            </div>
          )}

          {viewMode === 'board' ? (
            <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {BOARD_STATUSES.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={filteredTasks.filter((task) => task.status === status)}
                    onEdit={(task) => { setTaskToEdit(task); setModalOpen(true); }}
                    onDelete={(task) => setTaskToDelete(task)}
                    onDuplicate={handleDuplicateTask}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Drag a task card to another column to update its status. Changes are saved to your account.
              </p>
            </DndContext>
          ) : (
          /* Table */
          <div
            className="overflow-hidden rounded-2xl border shadow-sm transition-shadow duration-200 hover:shadow-md"
            style={{ borderColor: 'var(--border)' }}
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
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
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
                          className="group bg-[var(--bg-card)] transition-colors duration-150 hover:bg-white/[0.035]"
                          style={{
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
                            <select
                              aria-label={`Change status for ${task.title}`}
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as Status)}
                              className="rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                              style={{
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border)',
                              }}
                            >
                              {(['Todo', 'In Progress', 'Completed', 'Overdue'] as Status[]).map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
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
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateTask(task)}
                              aria-label={`Duplicate task ${task.title}`}
                              title="Duplicate task"
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-violet-400/25 px-2 text-xs font-semibold text-violet-300 transition-all duration-200 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => { setTaskToEdit(task); setModalOpen(true); }}
                              aria-label={`Edit task ${task.title}`}
                              title="Edit task"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/25 text-blue-300 transition-all duration-200 hover:border-blue-400/60 hover:bg-blue-500/15 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskToDelete(task)}
                              aria-label={`Delete task ${task.title}`}
                              title="Delete task"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/25 text-red-300 transition-all duration-200 hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={deletingTaskId === task.id}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v5M14 11v5" />
                              </svg>
                            </button>
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
                    <div key={task.id} className="space-y-3 p-4 transition-colors duration-150 hover:bg-white/[0.035]">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="font-medium text-sm leading-snug"
                          style={{ color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}
                        >
                          {task.status === 'Completed' ? <s>{task.title}</s> : task.title}
                        </p>
                        <div className="flex flex-shrink-0 items-center gap-2">
                        <select
                           aria-label={`Change status for ${task.title}`}
                           value={task.status}
                           onChange={(e) => handleStatusChange(task.id, e.target.value as Status)}
                           className="rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition-all duration-200 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                           style={{
                             background: 'var(--bg-card)',
                             color: 'var(--text-primary)',
                             border: '1px solid var(--border)',
                           }}
                         >
                           {(['Todo', 'In Progress', 'Completed', 'Overdue'] as Status[]).map((status) => (
                             <option key={status} value={status}>{status}</option>
                           ))}
                         </select>
                         <button
                           type="button"
                           onClick={() => handleDuplicateTask(task)}
                           aria-label={`Duplicate task ${task.title}`}
                           title="Duplicate task"
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/25 text-xs font-bold text-violet-300 transition-all duration-200 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                         >
                           ⧉
                         </button>
                         <button
                           type="button"
                           onClick={() => { setTaskToEdit(task); setModalOpen(true); }}
                           aria-label={`Edit task ${task.title}`}
                           title="Edit task"
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/25 text-blue-300 transition-all duration-200 hover:border-blue-400/60 hover:bg-blue-500/15 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                         >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                             <path d="M12 20h9" />
                             <path d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4Z" />
                           </svg>
                         </button>
                         <button
                           type="button"
                           onClick={() => setTaskToDelete(task)}
                           aria-label={`Delete task ${task.title}`}
                           title="Delete task"
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/25 text-red-300 transition-all duration-200 hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                         >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                             <path d="M3 6h18" />
                             <path d="M8 6V4h8v2" />
                             <path d="M19 6l-1 14H6L5 6" />
                             <path d="M10 11v5M14 11v5" />
                           </svg>
                         </button>
                         </div>
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
          )}
        </section>
      </main>

      {/* Delete confirmation dialog */}
      {taskToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingTaskId) {
              setTaskToDelete(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            aria-describedby="delete-task-description"
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" />
              </svg>
            </div>
            <h2 id="delete-task-title" className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Delete this task?
            </h2>
            <p id="delete-task-description" className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              You are about to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{taskToDelete.title}</strong>. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={deletingTaskId !== null}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={deletingTaskId !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingTaskId !== null ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  'Delete task'
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setTaskToEdit(null); }}
        onAdd={handleAddTask}
        onUpdate={handleUpdateTask}
        task={taskToEdit}
        projects={projectNames}
      />
    </div>
  );
}
