'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCircle } from 'lucide-react';
import {
  sendProfileCode,
  updateAvatar,
  updateContactInfo,
  updateDetails,
  updatePassword,
  type ProfileResult,
} from '../app/profile-actions';
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
  'w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-800';
const card = 'rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900';
const button =
  'flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60';

export function ProfileForm({ profile, onDone }: { profile: ProfileData; onDone: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Username / email / phone section (needs a code)
  const [username, setUsername] = useState(profile.username);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [waitingForCode, setWaitingForCode] = useState(false);
  const [code, setCode] = useState('');

  // Runs a profile action, shows a toast, and refreshes the page data when it worked
  const run = (action: () => Promise<ProfileResult>, onSuccess?: (res: ProfileResult) => void) => {
    startTransition(async () => {
      const res = await action();
      toast(res.success ? 'success' : 'error', res.message);
      if (res.success) {
        onSuccess?.(res);
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

  const changePassword = () => {
    if (newPassword !== confirmPassword) return toast('error', 'The new passwords do not match.');
    run(
      () => updatePassword(currentPassword, newPassword),
      () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    );
  };

  const contactChanged = username !== profile.username || email !== profile.email || phone !== profile.phone;

  const askForCode = () => {
    if (!contactChanged) return toast('error', 'You have not changed your username, email or phone.');
    run(
      () => sendProfileCode(),
      () => setWaitingForCode(true)
    );
  };

  const saveContact = () => {
    run(
      () => updateContactInfo(username, email, phone, code),
      () => {
        setWaitingForCode(false);
        setCode('');
      }
    );
  };

  return (
    <div className="space-y-6">
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

      {/* Normal details: saved directly */}
      <section className={card}>
        <h2 className="mb-3 font-semibold">Personal details</h2>
        <form action={(formData) => run(() => updateDetails(formData))} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Full name</label>
            <input name="fullName" defaultValue={profile.fullName ?? ''} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Address</label>
            <input
              name="address"
              defaultValue={profile.address ?? ''}
              placeholder="e.g., House 12, Road 5, Dhanmondi, Dhaka"
              className={input}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Occupation</label>
              <input name="occupation" defaultValue={profile.occupation ?? ''} className={input} />
            </div>
            <div>
              <p className="mb-1 text-sm">Gender</p>
              <div className="flex gap-4 pt-2 text-sm">
                {['Male', 'Female'].map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-1">
                    <input type="radio" name="gender" value={option} defaultChecked={profile.gender === option} />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" disabled={pending} className={button}>
            {pending && <Loader2 size={16} className="animate-spin" />} Save details
          </button>
        </form>
      </section>

      {/* Password: saved directly */}
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
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={input}
        />
        <p className="text-xs text-zinc-500">At least 6 characters, with 1 uppercase letter.</p>
        <button
          onClick={changePassword}
          disabled={pending}
          className={button}
        >
          Change password
        </button>
      </section>

      {/* Username, email and phone: need a verification code */}
      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Username, email and phone</h2>
        <p className="text-xs text-zinc-500">Changing these needs a verification code emailed to your current email address.</p>

        <div>
          <label className="mb-1 block text-sm">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={waitingForCode} className={input} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={waitingForCode} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={waitingForCode}
              placeholder="e.g., 017XXXXXXXX"
              className={input}
            />
          </div>
        </div>

        {!waitingForCode ? (
          <>
            <button onClick={askForCode} disabled={pending} className={button}>
              {pending && <Loader2 size={16} className="animate-spin" />} Send verification code
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              We emailed a 6-digit code to your current email address. Enter it below.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="Enter the 6-digit code"
              className={input}
            />
            <div className="flex gap-2">
              <button onClick={saveContact} disabled={pending || code.length !== 6} className={button}>
                {pending && <Loader2 size={16} className="animate-spin" />} Verify and save
              </button>
              <button
                onClick={() => {
                  setWaitingForCode(false);
                  setCode('');
                }}
                className="rounded-lg px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </section>

      <button
        onClick={onDone}
        className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Done editing
      </button>
    </div>
  );
}
