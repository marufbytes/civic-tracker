'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCircle } from 'lucide-react';
import { updateAvatar, updateDetails, updatePassword, updateUsername, type ProfileResult } from '../app/profile-actions';
import { uploadImage } from '../lib/upload-client';
import { useToast } from './Toast';

export type ProfileData = {
  username: string;
  email: string;
  phone: string;
  fullName: string | null;
  address: string | null;
  occupation: string | null;
  gender: string | null;
  avatarUrl: string | null;
};

const input =
  'w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800';
const card = 'rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900';
const button =
  'flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60';

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState(profile.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Runs a profile action, shows a toast, and refreshes the page data
  const run = (action: () => Promise<ProfileResult>, onDone?: () => void) => {
    startTransition(async () => {
      const res = await action();
      toast(res.success ? 'success' : 'error', res.message);
      if (res.success) {
        onDone?.();
        router.refresh();
      }
    });
  };

  const changeAvatar = (file: File | undefined) => {
    if (!file) return;
    run(async () => {
      const up = await uploadImage(file);
      if ('error' in up) return { success: false, message: up.error };
      return updateAvatar(up.url);
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">My Account</h1>

      {/* Profile picture */}
      <section className={`${card} flex items-center gap-4`}>
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <UserCircle size={80} className="text-zinc-400" />
        )}
        <div>
          <p className="font-medium">Profile picture</p>
          <label className="mt-1 inline-block cursor-pointer text-sm text-blue-600 hover:underline">
            Upload a new photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                changeAvatar(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      {/* Username */}
      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Username</h2>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
        <button onClick={() => run(() => updateUsername(username))} disabled={pending} className={button}>
          Change username
        </button>
      </section>

      {/* Password */}
      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Password</h2>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={input}
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={input}
        />
        <p className="text-xs text-zinc-500">At least 6 characters, with 1 uppercase letter.</p>
        <button
          onClick={() =>
            run(
              () => updatePassword(currentPassword, newPassword),
              () => {
                setCurrentPassword('');
                setNewPassword('');
              }
            )
          }
          disabled={pending}
          className={button}
        >
          Change password
        </button>
      </section>

      {/* Other details */}
      <section className={card}>
        <h2 className="mb-3 font-semibold">Personal details</h2>
        <form action={(formData) => run(() => updateDetails(formData))} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Full name</label>
            <input name="fullName" defaultValue={profile.fullName ?? ''} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Address</label>
            <input name="address" defaultValue={profile.address ?? ''} className={input} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Phone</label>
              <input name="phone" type="tel" required defaultValue={profile.phone} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <input name="email" type="email" required defaultValue={profile.email} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Occupation</label>
              <input name="occupation" defaultValue={profile.occupation ?? ''} className={input} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Gender</label>
              <select name="gender" defaultValue={profile.gender ?? ''} className={input}>
                <option value="">Prefer not to say</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={pending} className={button}>
            {pending && <Loader2 size={16} className="animate-spin" />} Save details
          </button>
        </form>
      </section>
    </div>
  );
}

