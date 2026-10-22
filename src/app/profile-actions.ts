'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from './lib/db';
import { comments, issues, users } from '../db/schema';
import { getCurrentUser } from '../lib/session';
import { checkPassword, hashPassword, passwordError } from '../lib/password';
import { validUploadUrl } from '../lib/uploads';

export type ProfileResult = {
  success: boolean;
  message: string;
};

function fail(message: string): ProfileResult {
  return { success: false, message };
}

export async function updateUsername(newUsername: string): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');

  newUsername = newUsername.trim();
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(newUsername)) {
    return fail('Username must be 3-30 letters, numbers or underscores.');
  }

  // Make sure no other user already has this username
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, newUsername), ne(users.id, user.id)))
    .limit(1);
  if (taken) return fail('That username is already taken.');

  await db.update(users).set({ username: newUsername }).where(eq(users.id, user.id));
  // Keep the author name on old reports and comments up to date
  await db.update(issues).set({ authorName: newUsername }).where(eq(issues.userId, user.id));
  await db.update(comments).set({ authorName: newUsername }).where(eq(comments.userId, user.id));

  revalidatePath('/', 'layout');
  return { success: true, message: 'Username updated.' };
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');

  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !checkPassword(currentPassword, row.passwordHash)) {
    return fail('Your current password is wrong.');
  }

  // The strict rule is skipped for admins (the default admin password is "admin")
  if (user.role !== 'admin') {
    const problem = passwordError(newPassword);
    if (problem) return fail(problem);
  } else if (newPassword.length < 1) {
    return fail('Enter a new password.');
  }

  await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, user.id));
  return { success: true, message: 'Password updated.' };
}

export async function updateAvatar(avatarUrl: string): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');
  if (!(await validUploadUrl(avatarUrl))) return fail('Uploaded photo is invalid. Please try again.');

  await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));
  revalidatePath('/', 'layout');
  return { success: true, message: 'Profile picture updated.' };
}

export async function updateDetails(formData: FormData): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');

  const fullName = String(formData.get('fullName') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').replace(/[\s()-]/g, '');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const occupation = String(formData.get('occupation') ?? '').trim();
  const gender = String(formData.get('gender') ?? '');

  if (!/^\+?\d{7,15}$/.test(phone)) return fail('Enter a valid phone number.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
  if (!['', 'Male', 'Female', 'Other'].includes(gender)) return fail('Invalid gender.');
  if (fullName.length > 100 || address.length > 300 || occupation.length > 100) {
    return fail('One of the fields is too long.');
  }

  await db
    .update(users)
    .set({
      fullName: fullName || null,
      address: address || null,
      phone,
      email,
      occupation: occupation || null,
      gender: gender || null,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/profile');
  return { success: true, message: 'Profile details saved.' };
}

