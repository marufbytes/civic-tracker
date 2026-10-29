'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { SessionUser } from '../lib/constants';
import { Navbar } from './Navbar';
import { ProfileForm, type ProfileData } from './ProfileForm';
import { ProfileView } from './ProfileView';
import { ToastProvider } from './Toast';

export function ProfilePage({ user, profile }: { user: SessionUser; profile: ProfileData }) {
  const [editing, setEditing] = useState(false);

  return (
    <ToastProvider>
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <ArrowLeft size={16} /> Back to Dashboard / Report Issue
        </Link>

        <h1 className="text-2xl font-bold">My Account</h1>

        {editing ? (
          <ProfileForm profile={profile} onDone={() => setEditing(false)} />
        ) : (
          <ProfileView profile={profile} onEdit={() => setEditing(true)} />
        )}
      </main>
    </ToastProvider>
  );
}
