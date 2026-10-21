
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (!data.session) {
          setMessage('Account created! Check your email to confirm your account, then sign in.');
        } else {
          setMessage('Account created successfully.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading TaskFlow...
      </main>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-end gap-3 p-3 bg-slate-900 text-white">
          <span className="text-sm">{session.user.email}</span>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-8"
      >
        <div>
          <h1 className="text-3xl font-bold">TaskFlow</h1>
          <p className="mt-2 text-sm text-slate-400">
            {signup ? 'Create your account' : 'Sign in to manage your tasks'}
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={signup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        )}

        {message && (
          <p role="status" className="text-sm text-emerald-400">{message}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
        >
          {busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => {
            setSignup(!signup);
            setError('');
            setMessage('');
          }}
          className="w-full text-sm text-blue-300 hover:text-blue-200"
        >
          {signup
            ? 'Already have an account? Sign in'
            : 'New to TaskFlow? Create an account'}
        </button>
      </form>
    </main>
  );
}
