
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AuthGate from '@/components/AuthGate';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/types';

type Project = {
  name: string;
  color: string;
};

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
];

function ProjectsContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: userData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !userData.user) {
      setError('Please sign in again.');
      setLoading(false);
      return;
    }

    const { data, error: taskError } = await supabase
      .from('tasks')
      .select(
        'id,title,description,priority,status,project,assignee,due_date,created_at',
      )
      .order('created_at', { ascending: false });

    if (taskError) {
      setError(taskError.message);
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      priority: r.priority,
      status: r.status,
      project: r.project,
      assignee: r.assignee,
      dueDate: r.due_date,
      createdAt: r.created_at,
    })) as Task[];

    setTasks(mapped);

    const key = `taskflow-projects-${userData.user.id}`;
    let saved: Project[] = [];

    try {
      saved = JSON.parse(
        localStorage.getItem(key) ?? '[]',
      ) as Project[];
    } catch {
      saved = [];
    }

    const names = new Set([
      ...mapped.map((t) => t.project),
      ...saved.map((p) => p.name),
    ]);

    setProjects(
      [...names]
        .filter(Boolean)
        .sort()
        .map(
          (n, i) =>
            saved.find((p) => p.name === n) ?? {
              name: n,
              color: COLORS[i % COLORS.length],
            },
        ),
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const persistProjects = async (next: Project[]) => {
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      localStorage.setItem(
        `taskflow-projects-${data.user.id}`,
        JSON.stringify(next),
      );
    }

    setProjects(next);
  };

  const details = useMemo(
    () =>
      projects.map((p) => {
        const list = tasks.filter((t) => t.project === p.name);

        return {
          ...p,
          count: list.length,
          completed: list.filter(
            (t) => t.status === 'Completed',
          ).length,
        };
      }),
    [projects, tasks],
  );

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();

    const nextName = name.trim();

    if (!nextName) return;

    if (
      !editing &&
      projects.some(
        (p) => p.name.toLowerCase() === nextName.toLowerCase(),
      )
    ) {
      setError('A project with that name already exists.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      let next = [...projects];

      if (editing) {
        if (
          nextName !== editing &&
          projects.some(
            (p) => p.name.toLowerCase() === nextName.toLowerCase(),
          )
        ) {
          throw new Error(
            'A project with that name already exists.',
          );
        }

        if (nextName !== editing) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ project: nextName })
            .eq('project', editing);

          if (updateError) throw updateError;

          setTasks((old) =>
            old.map((t) =>
              t.project === editing
                ? { ...t, project: nextName }
                : t,
            ),
          );
        }

        next = next.map((p) =>
          p.name === editing ? { ...p, name: nextName } : p,
        );
      } else {
        next.push({
          name: nextName,
          color: COLORS[next.length % COLORS.length],
        });
      }

      await persistProjects(next);

      setName('');
      setEditing(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save project.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject(project: Project) {
    if (
      !window.confirm(
        `Delete project "${project.name}"? Its tasks will be moved to "General".`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ project: 'General' })
        .eq('project', project.name);

      if (updateError) throw updateError;

      const hadTasks = tasks.some(
        (t) => t.project === project.name,
      );

      setTasks((old) =>
        old.map((t) =>
          t.project === project.name
            ? { ...t, project: 'General' }
            : t,
        ),
      );

      const next = projects.filter(
        (p) => p.name !== project.name,
      );

      if (
        hadTasks &&
        !next.some((p) => p.name === 'General')
      ) {
        next.push({
          name: 'General',
          color: '#64748b',
        });
      }

      await persistProjects(next);

      if (editing === project.name) {
        setEditing(null);
        setName('');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete project.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto pt-14 lg:pt-0">
        <header
          className="border-b px-6 py-5"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Projects
          </h1>

          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Organize work and track project progress
          </p>
        </header>

        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          <form
            onSubmit={saveProject}
            className="flex flex-col sm:flex-row gap-3 rounded-2xl border p-4"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                editing ? 'Rename project' : 'New project name'
              }
              aria-label="Project name"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              required
            />

            <button
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--accent-blue)' }}
            >
              {busy
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Create project'}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setName('');
                }}
                className="rounded-lg border px-4 py-2 text-sm"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
            )}
          </form>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>
              Loading projects…
            </p>
          ) : details.length === 0 ? (
            <div
              className="rounded-2xl border p-10 text-center"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              No projects yet. Create your first project above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {details.map((p) => {
                const progress =
                  p.count === 0
                    ? 0
                    : Math.round((p.completed / p.count) * 100);

                return (
                  <article
                    key={p.name}
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ background: p.color }}
                      />

                      <div className="min-w-0 flex-1">
                        <h2
                          className="break-words font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {p.name}
                        </h2>

                        <p
                          className="mt-1 text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {p.count} {p.count === 1 ? 'task' : 'tasks'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Edit ${p.name}`}
                        title="Rename project"
                        onClick={() => {
                          setEditing(p.name);
                          setName(p.name);
                          setError('');
                        }}
                        className="rounded-lg px-2 py-1 text-sm hover:bg-white/5 disabled:opacity-50"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>
                          Completed
                        </span>

                        <span style={{ color: 'var(--text-secondary)' }}>
                          {p.completed}/{p.count} · {progress}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ background: 'var(--border)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: p.color,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteProject(p)}
                      className="mt-5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Delete project
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AuthGate>
      <ProjectsContent />
    </AuthGate>
  );
}
