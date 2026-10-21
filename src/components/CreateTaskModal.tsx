'use client';

import { useEffect, useState } from 'react';
import { Task, Priority, Status } from '@/lib/types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Task) => Promise<boolean> | boolean;
  onUpdate: (task: Task) => Promise<boolean> | boolean;
  task: Task | null;
  projects: string[];
}

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: Status[] = ['Todo', 'In Progress', 'Completed', 'Overdue'];

export default function CreateTaskModal({ open, onClose, onAdd, onUpdate, task, projects }: CreateTaskModalProps) {
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

    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        project: task.project,
        assignee: task.assignee,
        dueDate: task.dueDate,
      });
    } else {
      setForm({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Todo',
        project: projects[0] ?? '',
        assignee: '',
        dueDate: '',
      });
    }

    setErrors({});
    setSubmitting(false);
  }, [open, task, projects]);

  if (!open) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (!form.assignee.trim()) e.assignee = 'Assignee is required';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const updatedTask: Task = {
      id: task?.id ?? `task-${Date.now()}`,
      ...form,
      createdAt: task?.createdAt ?? new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const saved = task ? await onUpdate(updatedTask) : await onAdd(updatedTask);
      if (saved === false) return;
      setErrors({});
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, submit: 'Something went wrong. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
              {task ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4Z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </div>
            <h2 id="task-modal-title" className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{task ? 'Edit Task' : 'Create New Task'}</h2>
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form id="create-task-form" onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Task Title <span style={{ color: 'var(--accent-red)' }}>*</span>
              </label>
              <input
                id="task-title-input"
                type="text"
                placeholder="e.g. Design the login page"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${errors.title ? 'var(--accent-red)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                }}
              />
              {errors.title && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                id="task-description-input"
                rows={2}
                placeholder="Optional details..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                <select
                  id="task-priority-select"
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <select
                  id="task-status-select"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Project + Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Project</label>
                <select
                  id="task-project-select"
                  value={form.project}
                  onChange={(e) => handleChange('project', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Assignee <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <input
                  id="task-assignee-input"
                  type="text"
                  placeholder="Name"
                  value={form.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${errors.assignee ? 'var(--accent-red)' : 'var(--border)'}`,
                    color: 'var(--text-primary)',
                  }}
                />
                {errors.assignee && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.assignee}</p>}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Due Date <span style={{ color: 'var(--accent-red)' }}>*</span>
              </label>
              <input
                id="task-duedate-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${errors.dueDate ? 'var(--accent-red)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  colorScheme: 'dark',
                }}
              />
              {errors.dueDate && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.dueDate}</p>}
            </div>
          </div>

          {errors.submit && (
            <p role="alert" className="px-6 pb-2 text-sm" style={{ color: 'var(--accent-red)' }}>{errors.submit}</p>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              id="modal-cancel-btn"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="modal-submit-btn"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {submitting ? (task ? 'Saving...' : 'Creating...') : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
