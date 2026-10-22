'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SessionUser } from '../lib/constants';
import { Navbar } from './Navbar';
import { AuthModal } from './AuthModal';
import { ProfileForm, type ProfileData } from './ProfileForm';
import { ToastProvider } from './Toast';

export function ProfilePage({ user, profile }: { user: SessionUser | null; profile: ProfileData | null }) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <ToastProvider>
      <Navbar user={user} onLogin={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <main className="p-4">
        {profile ? (
          <ProfileForm profile={profile} />
        ) : (
          <p className="mt-10 text-center text-zinc-500">
            Please log in to see your account.{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              Back to home
            </Link>
          </p>
        )}
      </main>
    </ToastProvider>
  );
}

