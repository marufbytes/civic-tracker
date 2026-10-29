'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from './lib/db';
import { users } from '../db/schema';
import { createSession, destroySession } from '../lib/session';
import { checkPassword, hashPassword, passwordError } from '../lib/password';
import { ensureAdmin } from '../lib/admin-seed';
import { checkCode, createCode, forgetCode, sendCode } from '../lib/otp';

export type AuthResult = {
  success: boolean;
  message: string;
};

function fail(message: string): AuthResult {
  return { success: false, message };
}

type SignUpData = {
  username: string;
  password: string;
  phone: string;
  email: string;
};

/** Reads and checks the sign up form. Returns the data, or an error message. */
function readSignUpForm(formData: FormData): { data: SignUpData } | { error: string } {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const phone = String(formData.get('phone') ?? '').replace(/[\s()-]/g, '');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return { error: 'Username must be 3-30 letters, numbers or underscores.' };
  }
  const passwordProblem = passwordError(password);
  if (passwordProblem) return { error: passwordProblem };
  if (!/^\+?\d{7,15}$/.test(phone)) return { error: 'Enter a valid mobile number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };

  return { data: { username, password, phone, email } };
}

async function usernameIsTaken(username: string) {
  const [found] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  return Boolean(found);
}

/** Sign up step 1: check the form and email a verification code. No account is created yet. */
export async function sendSignUpCode(formData: FormData): Promise<AuthResult> {
  const form = readSignUpForm(formData);
  if ('error' in form) return fail(form.error);
  const { username, email } = form.data;

  try {
    if (await usernameIsTaken(username)) return fail('That username is already taken.');

    const created = await createCode(email, 'signup');
    if ('error' in created) return fail(created.error);

    const emailed = await sendCode(email, created.code);
    if (!emailed) {
      await forgetCode(email, 'signup');
      return fail('We could not send the email. Check the address and try again.');
    }
    return { success: true, message: `We sent a 6-digit code to ${email}. Check your inbox.` };
  } catch (e) {
    console.error('sendSignUpCode failed', e);
    return fail('Could not send the code. Please try again.');
  }
}

/** Sign up step 2: check the code, and only then create the account. */
export async function verifySignUp(formData: FormData): Promise<AuthResult> {
  const form = readSignUpForm(formData);
  if ('error' in form) return fail(form.error);
  const { username, password, phone, email } = form.data;
  const code = String(formData.get('code') ?? '');

  try {
    const codeProblem = await checkCode(email, 'signup', code);
    if (codeProblem) return fail(codeProblem);

    if (await usernameIsTaken(username)) return fail('That username is already taken.');

    const [created] = await db
      .insert(users)
      .values({ username, passwordHash: hashPassword(password), email, phone })
      .returning({ id: users.id });
    // The user is NOT logged in here. They have to log in by hand after signing up.
    if (!created) return fail('Could not create your account. Please try again.');
  } catch (e) {
    console.error('verifySignUp failed', e);
    return fail('Could not create your account. Please try again.');
  }

  return { success: true, message: 'Account created successfully! Please log in.' };
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
