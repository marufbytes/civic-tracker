'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from './lib/db';
import { users } from '../db/schema';
import { createSession, destroySession } from '../lib/session';
import { checkPassword, hashPassword, passwordError } from '../lib/password';
import { ensureAdmin } from '../lib/admin-seed';

export type AuthResult = {
  success: boolean;
  message: string;
};

function fail(message: string): AuthResult {
  return { success: false, message };
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const phone = String(formData.get('phone') ?? '').replace(/[\s()-]/g, '');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return fail('Username must be 3-30 letters, numbers or underscores.');
  }
  const passwordProblem = passwordError(password);
  if (passwordProblem) return fail(passwordProblem);
  if (!/^\+?\d{7,15}$/.test(phone)) return fail('Enter a valid mobile number.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');

  try {
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (taken) return fail('That username is already taken.');

    const [created] = await db
      .insert(users)
      .values({ username, passwordHash: hashPassword(password), email, phone })
      .returning({ id: users.id });

    await createSession(created.id);
  } catch (e) {
    console.error('signUp failed', e);
    return fail('Could not create your account. Please try again.');
  }

  revalidatePath('/');
  return { success: true, message: 'Account created. Welcome!' };
}

export async function logIn(formData: FormData): Promise<AuthResult> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  try {
    await ensureAdmin();
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user || !checkPassword(password, user.passwordHash)) {
      return fail('Wrong username or password.');
    }
    await createSession(user.id);
  } catch (e) {
    console.error('logIn failed', e);
    return fail('Could not log in. Please try again.');
  }

  revalidatePath('/');
  return { success: true, message: 'Logged in successfully!' };
}

export async function logout(): Promise<AuthResult> {
  await destroySession();
  revalidatePath('/');
  return { success: true, message: 'Logged out.' };
}
