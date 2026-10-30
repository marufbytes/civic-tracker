'use client';

import { useSyncExternalStore, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Landmark, LogIn, LogOut, Moon, Sun, ShieldCheck, UserCircle, UserPlus } from 'lucide-react';
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
      className="cursor-pointer rounded-lg border border-zinc-300 p-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

// Used on every page. Logged-out visitors get section links and Log In / Sign Up buttons.
// Logged-in users get Home, Dashboard and My Profile.
export function Navbar({
  user,
  onLogin,
  onSignUp,
}: {
  user: SessionUser | null;
  onLogin?: () => void;
  onSignUp?: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const doLogout = () =>
    startTransition(async () => {
      const res = await logout();
      toast('success', res.message);
      router.push('/');
      router.refresh();
    });

  const links = user
    ? [
        { href: '/', label: 'Home' },
        { href: '/#overview', label: 'Live Map Overview' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/profile', label: 'My Profile' },
      ]
    : [
        { href: '/#about', label: 'About Us' },
        { href: '/#overview', label: 'Live Map Overview' },
      ];

  return (
    <header className="sticky top-0 z-[1000] border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex cursor-pointer items-center gap-2 text-lg font-bold">
          <Landmark className="text-blue-600" />
          <span className="hidden sm:inline">Civic Issue Tracker</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`cursor-pointer rounded-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                pathname === link.href ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <UserCircle size={26} className="text-zinc-400" />
                )}
                <span className="hidden font-medium md:inline">{user.displayName}</span>
                {user.role === 'admin' && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    <ShieldCheck size={12} /> Admin
                  </span>
                )}
              </div>
              <button
                onClick={doLogout}
                disabled={pending}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onLogin}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <LogIn size={14} /> Log In
              </button>
              <button
                onClick={onSignUp}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <UserPlus size={14} /> Sign Up
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
