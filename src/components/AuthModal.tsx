'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, Landmark, Loader2, Lock, Mail, Phone, User, X } from 'lucide-react';
import { logIn, sendSignUpCode, verifySignUp, type AuthResult } from '../app/auth-actions';
import { useToast } from './Toast';

// An input box with an icon on the left and a nice focus ring
function Field({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-800';

// Render this component only while the modal is open. It starts fresh every time it opens.
export function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  reason,
}: {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  reason?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Green message shown after the account was created
  const [notice, setNotice] = useState<string | null>(null);

  const makeFormData = () => {
    const formData = new FormData();
    formData.set('username', username);
    formData.set('password', password);
    formData.set('phone', phone);
    formData.set('email', email);
    formData.set('code', code);
    return formData;
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setStep('form');
    setError(null);
    setNotice(null);
  };

  // Runs a server action, shows an error if it failed, and tells us when it worked
  const run = (action: () => Promise<AuthResult>, onSuccess: (res: AuthResult) => void) => {
    startTransition(async () => {
      setError(null);
      const res = await action();
      if (!res.success) return setError(res.message);
      onSuccess(res);
    });
  };

  // After a successful log in, go straight to the dashboard
  const finishLogin = (res: AuthResult) => {
    toast('success', res.message);
    onClose();
    router.push('/dashboard');
    router.refresh();
  };

  // After sign up the account exists, but the user must log in by hand
  const finishSignUp = () => {
    toast('success', 'Account created successfully! Please log in.', 6);
    setNotice('Account created successfully! Please log in.');
    setMode('login');
    setStep('form');
    setPassword('');
    setCode('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
      run(() => logIn(makeFormData()), finishLogin);
    } else if (step === 'form') {
      run(
        () => sendSignUpCode(makeFormData()),
        (res) => {
          setStep('code');
          toast('success', res.message, 6);
        }
      );
    } else {
      run(() => verifySignUp(makeFormData()), finishSignUp);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Welcome header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 cursor-pointer rounded-full p-1 hover:bg-white/20"
          >
            <X size={18} />
          </button>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <Landmark size={22} />
          </div>
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome back' : step === 'form' ? 'Join your community' : 'Check your email'}
          </h2>
          <p className="text-sm text-blue-100">
            {reason ?? (mode === 'login' ? 'Log in to report, upvote and comment.' : 'Help make your city better.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {step === 'form' && (
            <>
              <Field icon={<User size={16} />}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className={inputClass}
                />
              </Field>
              <Field icon={<Lock size={16} />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className={inputClass}
                />
              </Field>
              {mode === 'signup' && (
                <>
                  <p className="-mt-2 text-xs text-zinc-500">At least 6 characters, with 1 uppercase letter.</p>
                  <Field icon={<Phone size={16} />}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Mobile, e.g., 017XXXXXXXX"
                      required
                      className={inputClass}
                    />
                  </Field>
                  <Field icon={<Mail size={16} />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email (we will send a code here)"
                      required
                      className={inputClass}
                    />
                  </Field>
                </>
              )}
            </>
          )}

          {step === 'code' && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it below to create your
                account.
              </p>
              <Field icon={<KeyRound size={16} />}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoFocus
                  placeholder="123456"
                  className={`${inputClass} font-mono tracking-widest`}
                />
              </Field>
            </>
          )}

          {notice && (
            <p className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 size={16} /> {notice}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending || (step === 'code' && code.length !== 6)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Log in' : step === 'form' ? 'Send Verification Code' : 'Verify & Create Account'}
          </button>

          {step === 'code' && (
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setError(null);
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-1 text-sm text-zinc-500 hover:underline"
            >
              <ArrowLeft size={14} /> Go back and edit my details
            </button>
          )}
        </form>

        <div className="border-t border-zinc-200 px-6 py-4 text-center text-sm dark:border-zinc-800">
          <button onClick={switchMode} className="cursor-pointer font-medium text-blue-600 hover:underline">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
