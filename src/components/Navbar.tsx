'use client';

import { useSyncExternalStore, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, LogIn, LogOut, Moon, Sun, ShieldCheck, UserCircle } from 'lucide-react';
import { logout } from '../app/auth-actions';
import type { SessionUser } from '../lib/constants';
import { useToast } from './Toast';

function subscribe(cb: () => void) {
  window.addEventListener('theme-change', cb);
  return () => window.removeEventListener('theme-change', cb);
}

function useIsDark() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'),
    () => false
  );
}

export function ThemeToggle() {
  const dark = useIsDark();
  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event('theme-change'));
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-lg border border-zinc-300 p-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function Navbar({ user, onLogin }: { user: SessionUser | null; onLogin: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const doLogout = () =>
    startTransition(async () => {
      const res = await logout();
      toast('success', res.message);
      router.push('/');
      router.refresh();
    });

  return (
    <header className="sticky top-0 z-[1000] border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Landmark className="text-blue-600" />
          Civic Issue Tracker
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Link href="/profile" className="flex items-center gap-2 hover:underline" title="My account">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <UserCircle size={26} className="text-zinc-400" />
                  )}
                  <span className="hidden font-medium sm:inline">{user.name}</span>
                </Link>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {user.role === 'admin' && <ShieldCheck size={12} />}
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              <button
                onClick={doLogout}
                disabled={pending}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <LogIn size={14} /> Log in
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

