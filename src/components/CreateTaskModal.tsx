'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, Priority, Status } from '@/lib/types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Task) => Promise<boolean> | boolean;
  onUpdate: (task: Task) => Promise<boolean> | boolean;
  task: Task | null;
  projects: string[];
}

const PRIORITIES: Priority[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

const STATUSES: Status[] = [
  'Todo',
  'In Progress',
  'Completed',
  'Overdue',
];

export default function CreateTaskModal({
  open,
  onClose,
  onAdd,
  onUpdate,
  task,
  projects,
}: CreateTaskModalProps) {
  const [projectOptions, setProjectOptions] = useState<string[]>(projects);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Priority,
    status: 'Todo' as Status,
    project: projects[0] ?? '',
    assignee: '',
    dueDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadProjects() {
      let savedProjects: string[] = [];

      try {
        const { data } = await supabase.auth.getUser();

        if (data.user) {
          const key = `taskflow-projects-${data.user.id}`;
          const saved = localStorage.getItem(key);

          if (saved) {
            const parsed: unknown = JSON.parse(saved);

            if (Array.isArray(parsed)) {
              savedProjects = parsed
                .map((p) =>
                  typeof p === 'string' ? p : p?.name,
                )
                .filter(
                  (name): name is string =>
                    typeof name === 'string' &&
                    name.trim().length > 0,
                );
            }
          }
        }
      } catch (err) {
        console.error('Could not load saved projects:', err);
      }

      if (cancelled) return;

      const options = Array.from(
        new Set([
          ...projects,
          ...savedProjects,
          ...(task?.project ? [task.project] : []),
        ]),
      ).sort((a, b) => a.localeCompare(b));

      setProjectOptions(options);

      setForm({
        title: task?.title ?? '',
        description: task?.description ?? '',
        priority: task?.priority ?? 'Medium',
        status: task?.status ?? 'Todo',
        project: task?.project ?? options[0] ?? '',
        assignee: task?.assignee ?? '',
        dueDate: task?.dueDate ?? '',
      });

      setErrors({});
      setSubmitting(false);
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [open, task, projects]);

  if (!open) return null;

  function handleChange(
    field: string,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    if (submitting) return;

    const nextErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required';
    }

    if (!form.dueDate) {
      nextErrors.dueDate = 'Due date is required';
    }

    if (!form.assignee.trim()) {
      nextErrors.assignee = 'Assignee is required';
    }

    if (!form.project) {
      nextErrors.project = 'Select a project';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const updatedTask: Task = {
      id: task?.id ?? `task-${Date.now()}`,
      ...form,
      createdAt: task?.createdAt ?? new Date().toISOString(),
    };

    setSubmitting(true);

    try {
      const result = task
        ? await onUpdate(updatedTask)
        : await onAdd(updatedTask);

      if (result === false) return;

      setErrors({});
      onClose();
    } catch (err) {
      console.error('Could not save task:', err);

      setErrors({
        submit: 'Could not save the task. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  const labelStyle = {
    color: 'var(--text-secondary)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <header
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            id="task-modal-title"
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-4 px-6 py-5">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium"
                style={labelStyle}
              >
                Task Title *
              </label>

              <input
                value={form.title}
                onChange={(e) =>
                  handleChange('title', e.target.value)
                }
                placeholder="e.g. Design the login page"
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{
                  ...inputStyle,
                  borderColor: errors.title
                    ? 'var(--accent-red)'
                    : 'var(--border)',
                }}
              />

              {errors.title && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium"
                style={labelStyle}
              >
                Description
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  handleChange('description', e.target.value)
                }
                placeholder="Optional details..."
                className="w-full resize-none rounded-lg px-3 py-2.5 text-sm"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={labelStyle}
                >
                  Priority
                </label>

                <select
                  value={form.priority}
                  onChange={(e) =>
                    handleChange('priority', e.target.value)
                  }
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={inputStyle}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={labelStyle}
                >
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    handleChange('status', e.target.value)
                  }
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={inputStyle}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={labelStyle}
                >
                  Project *
                </label>

                <select
                  value={form.project}
                  onChange={(e) =>
                    handleChange('project', e.target.value)
                  }
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={inputStyle}
                >
                  {projectOptions.length === 0 && (
                    <option value="">
                      No projects available
                    </option>
                  )}

                  {projectOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {errors.project && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.project}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-medium"
                  style={labelStyle}
                >
                  Assignee *
                </label>

                <input
                  value={form.assignee}
                  onChange={(e) =>
                    handleChange('assignee', e.target.value)
                  }
                  placeholder="Name"
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={inputStyle}
                />

                {errors.assignee && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.assignee}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium"
                style={labelStyle}
              >
                Due Date *
              </label>

              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  handleChange('dueDate', e.target.value)
                }
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{
                  ...inputStyle,
                  colorScheme: 'dark',
                  borderColor: errors.dueDate
                    ? 'var(--accent-red)'
                    : 'var(--border)',
                }}
              />

              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          {errors.submit && (
            <p
              role="alert"
              className="px-6 pb-3 text-sm text-red-400"
            >
              {errors.submit}
            </p>
          )}

          <footer
            className="flex gap-3 border-t px-6 py-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium disabled:opacity-50"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || projectOptions.length === 0}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              }}
            >
              {submitting
                ? 'Saving...'
                : task
                  ? 'Save Changes'
                  : 'Create Task'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}