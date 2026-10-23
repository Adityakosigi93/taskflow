
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import Sidebar from '@/components/Sidebar';
import CreateTaskModal from '@/components/CreateTaskModal';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { supabase } from '@/lib/supabase';
import { SAMPLE_PROJECTS } from '@/lib/data';
import type { Task, Status, Priority } from '@/lib/types';

const STATUSES: Status[] = ['Todo', 'In Progress', 'Completed', 'Overdue'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

function TasksContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('due');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth.user) {
      setError('Please sign in again to view your tasks.');
      setLoading(false);
      return;
    }

    const { data, error: taskError } = await supabase
      .from('tasks')
      .select('id,title,description,priority,status,project,assignee,due_date,created_at')
      .order('created_at', { ascending: false });

    if (taskError) {
      setError(`Could not load tasks: ${taskError.message}`);
      setLoading(false);
      return;
    }

    const loaded: Task[] = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      priority: r.priority as Priority,
      status: r.status as Status,
      project: r.project,
      assignee: r.assignee,
      dueDate: r.due_date,
      createdAt: r.created_at,
    }));

    setTasks(loaded);

    const key = `taskflow-projects-${auth.user.id}`;
    let savedNames: string[] = [];

    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');

      if (Array.isArray(saved)) {
        savedNames = saved
          .map((p) => (typeof p === 'string' ? p : p?.name))
          .filter(
            (p): p is string => typeof p === 'string' && !!p.trim(),
          );
      }
    } catch {
      savedNames = [];
    }

    setProjects(
      Array.from(
        new Set([
          ...SAMPLE_PROJECTS.map((p) => p.name),
          ...loaded.map((t) => t.project),
          ...savedNames,
        ]),
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    );

    setLoading(false);
  }, []);

  // Schedule loading after the effect runs to avoid synchronous state updates.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = tasks.filter((t) => {
      const matchesSearch = [
        t.title,
        t.description,
        t.project,
        t.assignee,
      ].some((v) => (v ?? '').toLowerCase().includes(q));

      return (
        matchesSearch &&
        (statusFilter === 'All' || t.status === statusFilter) &&
        (projectFilter === 'All' || t.project === projectFilter) &&
        (priorityFilter === 'All' || t.priority === priorityFilter)
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'priority') {
        return (
          PRIORITIES.indexOf(a.priority) -
          PRIORITIES.indexOf(b.priority)
        );
      }

      if (sortBy === 'newest') {
        return b.createdAt.localeCompare(a.createdAt);
      }

      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }

      return a.dueDate.localeCompare(b.dueDate);
    });

    return result;
  }, [tasks, search, statusFilter, projectFilter, priorityFilter, sortBy]);

  async function addTask(task: Task): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setError('Your session has expired. Please sign in again.');
      return false;
    }

    const { data, error: saveError } = await supabase
      .from('tasks')
      .insert({
        title: task.title.trim(),
        description: task.description.trim() || null,
        priority: task.priority,
        status: task.status,
        project: task.project,
        assignee: task.assignee.trim(),
        due_date: task.dueDate,
        user_id: auth.user.id,
      })
      .select('id,title,description,priority,status,project,assignee,due_date,created_at')
      .single();

    if (saveError) {
      setError(`Could not create task: ${saveError.message}`);
      return false;
    }

    setTasks((prev) => [
      {
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        priority: data.priority as Priority,
        status: data.status as Status,
        project: data.project,
        assignee: data.assignee,
        dueDate: data.due_date,
        createdAt: data.created_at,
      },
      ...prev,
    ]);

    notify('Task created successfully.');
    return true;
  }

  async function updateTask(task: Task): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setError('Please sign in again.');
      return false;
    }

    const { data, error: saveError } = await supabase
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
      .eq('user_id', auth.user.id)
      .select('id,title,description,priority,status,project,assignee,due_date,created_at')
      .single();

    if (saveError) {
      setError(`Could not update task: ${saveError.message}`);
      return false;
    }

    const saved: Task = {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      priority: data.priority as Priority,
      status: data.status as Status,
      project: data.project,
      assignee: data.assignee,
      dueDate: data.due_date,
      createdAt: data.created_at,
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === saved.id ? saved : t)),
    );

    notify('Task updated successfully.');
    return true;
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    setBusyId(task.id);
    setError('');

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setError('Please sign in again.');
      setBusyId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)
      .eq('user_id', auth.user.id);

    if (deleteError) {
      setError(`Could not delete task: ${deleteError.message}`);
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      notify('Task deleted.');
    }

    setBusyId(null);
  }

  async function changeStatus(task: Task, status: Status) {
    await updateTask({ ...task, status });
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto pt-14 lg:pt-0">
        <header
          className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              My Tasks
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Manage, organize and track all your tasks.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'var(--accent-blue)' }}
          >
            + Create Task
          </button>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Total tasks', value: tasks.length },
              {
                label: 'To do',
                value: tasks.filter((t) => t.status === 'Todo').length,
              },
              {
                label: 'In progress',
                value: tasks.filter((t) => t.status === 'In Progress').length,
              },
              {
                label: 'Completed',
                value: tasks.filter((t) => t.status === 'Completed').length,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border p-4"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </p>
                <p
                  className="mt-2 text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="All">All projects</option>
              {projects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="All">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="due">Sort: Due date</option>
              <option value="priority">Sort: Priority</option>
              <option value="newest">Sort: Newest</option>
              <option value="title">Sort: Title A–Z</option>
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
              <button
                className="ml-3 underline"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          )}

          {toast && (
            <p role="status" className="text-sm text-emerald-400">
              {toast}
            </p>
          )}

          {loading ? (
            <p
              className="py-10 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              Loading tasks…
            </p>
          ) : filteredTasks.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
              }}
            >
              <h2
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
              </h2>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {tasks.length === 0
                  ? 'Create your first task to get started.'
                  : 'Try changing your search or filters.'}
              </p>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-xl border"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
              }}
            >
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <tr>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Due date</th>
                    <th className="px-4 py-3 font-medium">Assignee</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-t"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-4 py-4">
                        <p
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p
                            className="mt-1 max-w-xs truncate text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td
                        className="px-4 py-4"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {task.project}
                      </td>

                      <td className="px-4 py-4">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      <td className="px-4 py-4">
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          disabled={busyId === task.id}
                          onChange={(e) =>
                            void changeStatus(
                              task,
                              e.target.value as Status,
                            )
                          }
                          className="max-w-36 rounded-lg border px-2 py-1.5 text-xs"
                          style={{
                            borderColor: 'var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <div className="mt-1">
                          <StatusBadge status={task.status} />
                        </div>
                      </td>

                      <td
                        className="whitespace-nowrap px-4 py-4"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {task.dueDate
                          ? new Date(
                              `${task.dueDate}T00:00:00`,
                            ).toLocaleDateString()
                          : '—'}
                      </td>

                      <td
                        className="px-4 py-4"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {task.assignee}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setModalOpen(true);
                            }}
                            className="rounded-md px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10"
                          >
                            Edit
                          </button>

                          <button
                            disabled={busyId === task.id}
                            onClick={() => void deleteTask(task)}
                            className="rounded-md px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <CreateTaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onAdd={addTask}
        onUpdate={updateTask}
        task={editingTask}
        projects={projects}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <AuthGate>
      <TasksContent />
    </AuthGate>
  );
}
