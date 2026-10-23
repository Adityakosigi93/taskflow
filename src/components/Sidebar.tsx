
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const menu = [
  { name: 'Dashboard', href: '/', icon: '▦' },
  { name: 'My Tasks', href: '/tasks', icon: '☑' },
  { name: 'Projects', href: '/projects', icon: '▣' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (active && !error) {
        setEmail(data.user?.email ?? '');
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setEmail(session?.user?.email ?? '');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setSigningOut(false);
      alert('Could not sign out. Please try again.');
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-slate-700/60 bg-[#171d2a] text-slate-300">
      <Link
        href="/"
        className="flex h-[86px] items-center gap-3 border-b border-slate-700/60 px-5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-xl text-white">
          ☑
        </span>
        <span className="text-xl font-bold text-white">
          Task<span className="text-blue-400">Flow</span>
        </span>
      </Link>

      <div className="px-5 pb-3 pt-5 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Menu
      </div>

      <nav className="flex-1 space-y-2 px-3">
        {menu.map((item) => {
          const selected =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                selected
                  ? 'bg-blue-500/15 font-semibold text-blue-400'
                  : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
              }`}
            >
              <span className="w-5 text-lg">{item.icon}</span>
              <span>{item.name}</span>
              {selected && (
                <span className="ml-auto h-2 w-2 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/60 p-4">
        <div className="mb-3 break-all text-sm text-slate-400">
          {email || 'Loading account...'}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
