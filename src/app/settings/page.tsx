'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AuthGate from '@/components/AuthGate';
import { supabase } from '@/lib/supabase';

function SettingsContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();

      if (active) {
        setEmail(data.user?.email ?? '');
      }

      const savedTheme = localStorage.getItem('taskflow-theme');

      if (
        active &&
        (savedTheme === 'dark' || savedTheme === 'light')
      ) {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function changeTheme(value: 'dark' | 'light') {
    setTheme(value);
    localStorage.setItem('taskflow-theme', value);
    document.documentElement.dataset.theme = value;
    setMessage('Appearance preference saved.');
    setError('');
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      setPassword('');
      setConfirmPassword('');
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update your password.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError('');

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setBusy(false);
      return;
    }

    router.replace('/');
    router.refresh();
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
            Settings
          </h1>

          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Manage your account and preferences
          </p>
        </header>

        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {message && (
            <p
              role="status"
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <section
            className="rounded-2xl border p-6"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Account
            </h2>

            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Your currently signed-in account.
            </p>

            <label
              className="mt-5 block text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email address
            </label>

            <input
              value={email}
              readOnly
              className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </section>

          <section
            className="rounded-2xl border p-6"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Appearance
            </h2>

            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Choose your preferred interface theme.
            </p>

            <div className="mt-4 flex gap-3">
              {(['dark', 'light'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeTheme(value)}
                  aria-pressed={theme === value}
                  className="rounded-lg border px-4 py-2 text-sm font-medium capitalize"
                  style={{
                    borderColor:
                      theme === value
                        ? 'var(--accent-blue)'
                        : 'var(--border)',
                    background:
                      theme === value
                        ? 'rgba(59,130,246,0.12)'
                        : 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </section>

          <section
            className="rounded-2xl border p-6"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Change password
            </h2>

            <form onSubmit={updatePassword} className="mt-4 space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  New password
                </label>

                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Confirm new password
                </label>

                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--accent-blue)' }}
              >
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>

          <section
            className="rounded-2xl border border-red-500/20 p-6"
            style={{ background: 'var(--bg-card)' }}
          >
            <h2 className="text-base font-semibold text-red-400">
              Sign out
            </h2>

            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Sign out of your TaskFlow account on this device.
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={() => void signOut()}
              className="mt-4 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {busy ? 'Please wait…' : 'Sign out'}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGate>
      <SettingsContent />
    </AuthGate>
  );
}