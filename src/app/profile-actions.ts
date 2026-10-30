'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from './lib/db';
import { comments, issues, users } from '../db/schema';
import { getCurrentUser } from '../lib/session';
import { checkPassword, hashPassword, passwordError } from '../lib/password';
import { validImageDataUrl } from '../lib/uploads';
import { checkCode, createCode, forgetCode, sendCode } from '../lib/otp';

export type ProfileResult = {
  success: boolean;
  message: string;
};

function fail(message: string): ProfileResult {
  return { success: false, message };
}

/** Normal fields: saved directly, no code needed. */
export async function updateDetails(formData: FormData): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');

  const fullName = String(formData.get('fullName') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const occupation = String(formData.get('occupation') ?? '').trim();
  const gender = String(formData.get('gender') ?? '');

  if (!['', 'Male', 'Female'].includes(gender)) return fail('Gender must be Male or Female.');
  if (fullName.length > 100 || address.length > 300 || occupation.length > 100) {
    return fail('One of the fields is too long.');
  }

  await db
    .update(users)
    .set({
      fullName: fullName || null,
      address: address || null,
      occupation: occupation || null,
      gender: gender || null,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/', 'layout');
  return { success: true, message: 'Profile details saved.' };
}

export async function updateAvatar(avatarUrl: string): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');
  if (!validImageDataUrl(avatarUrl)) return fail('Uploaded photo is invalid. Please try again.');

  await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));
  revalidatePath('/', 'layout');
  return { success: true, message: 'Profile picture updated.' };
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

/** Sensitive fields step 1: email a code to the user's CURRENT email address. */
export async function sendProfileCode(): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');

  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  const created = await createCode(row.email, 'profile');
  if ('error' in created) return fail(created.error);

  const emailed = await sendCode(row.email, created.code);
  if (!emailed) {
    await forgetCode(row.email, 'profile');
    return fail('We could not send the email. Please try again later.');
  }
  return { success: true, message: `We sent a 6-digit code to ${row.email}. Check your inbox.` };
}

/** Sensitive fields step 2: check the code, then update username, email and phone. */
export async function updateContactInfo(
  username: string,
  email: string,
  phone: string,
  code: string
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Please log in first.');

  username = username.trim();
  email = email.trim().toLowerCase();
  phone = phone.replace(/[\s()-]/g, '');

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return fail('Username must be 3-30 letters, numbers or underscores.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
  if (!/^\+?\d{7,15}$/.test(phone)) return fail('Enter a valid phone number.');

  // The code was sent to the current email address, so check it against that
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const codeProblem = await checkCode(row.email, 'profile', code);
  if (codeProblem) return fail(codeProblem);

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, user.id)))
    .limit(1);
  if (taken) return fail('That username is already taken.');

  await db.update(users).set({ username, email, phone }).where(eq(users.id, user.id));
  // Keep the author name on old reports and comments up to date
  await db.update(issues).set({ authorName: username }).where(eq(issues.userId, user.id));
  await db.update(comments).set({ authorName: username }).where(eq(comments.userId, user.id));

  revalidatePath('/', 'layout');
  return { success: true, message: 'Account details updated.' };
}
