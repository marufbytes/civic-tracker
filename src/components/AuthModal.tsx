'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { logIn, signUp } from '../app/auth-actions';
import { useToast } from './Toast';

const input =
  'w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800';

export function AuthModal({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: string }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const res = mode === 'login' ? await logIn(formData) : await signUp(formData);
      if (!res.success) return setError(res.message);
      toast('success', res.message);
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{mode === 'login' ? 'Log in' : 'Create an account'}</h2>
            <p className="text-sm text-zinc-500">{reason ?? 'Log in to report, upvote and comment.'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>

        {/* key makes React reset the fields when switching between login and sign up */}
        <form key={mode} action={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <input name="username" required className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input name="password" type="password" required className={input} />
            {mode === 'signup' && (
              <p className="mt-1 text-xs text-zinc-500">At least 6 characters, with 1 uppercase letter.</p>
            )}
          </div>
          {mode === 'signup' && (
            <>
              <div>
                <label className="mb-1 block text-sm">Mobile</label>
                <input name="phone" type="tel" required placeholder="+8801700000000" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <input name="email" type="email" required className={input} />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
          }}
          className="mt-4 w-full text-sm text-blue-600 hover:underline"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
