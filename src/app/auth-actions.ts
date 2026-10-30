'use server';

import { eq, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from './lib/db';
import { users } from '../db/schema';
import { createSession, destroySession } from '../lib/session';
import { checkPassword, hashPassword, passwordError } from '../lib/password';
import { ensureAdmin } from '../lib/admin-seed';
import { checkCode, createCode, forgetCode, sendCode } from '../lib/otp';

const PASSWORD_RESET_LIFETIME = 10 * 60 * 1000;

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
  const identifier = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!identifier || !password) return fail('Enter your username or email and password.');

  try {
    await ensureAdmin();
    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(
        or(
          sql`lower(${users.username}) = ${identifier}`,
          sql`lower(${users.email}) = ${identifier}`
        )
      )
      .limit(1);
    if (!user || !checkPassword(password, user.passwordHash)) {
      return fail('Wrong username/email or password.');
    }
    await createSession(user.id);
  } catch (e) {
    console.error('logIn failed', e);
    return fail('Could not log in. Please try again.');
  }

  revalidatePath('/');
  return { success: true, message: 'Logged in successfully!' };
}

export async function sendPasswordResetOtp(email: string): Promise<AuthResult> {
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);
    if (!user) return fail('No account was found with that email address.');

    const created = await createCode(email, 'password_reset', PASSWORD_RESET_LIFETIME);
    if ('error' in created) return fail(created.error);

    const emailed = await sendCode(email, created.code, {
      subject: 'Your password reset code',
      expiresInMinutes: PASSWORD_RESET_LIFETIME / 60_000,
    });
    if (!emailed) {
      await forgetCode(email, 'password_reset', created.code);
      return fail('We could not send the reset code. Please try again later.');
    }

    return { success: true, message: `We sent a reset code to ${email}. It expires in 10 minutes.` };
  } catch (e) {
    console.error('sendPasswordResetOtp failed', e);
    return fail('Could not send the reset code. Please try again.');
  }
}

export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<AuthResult> {
  email = email.trim().toLowerCase();
  otp = otp.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
  if (!/^\d{6}$/.test(otp)) return fail('Enter the 6-digit reset code.');
  const passwordProblem = passwordError(newPassword);
  if (passwordProblem) return fail(passwordProblem);

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);
    if (!user) return fail('No account was found with that email address.');

    const codeProblem = await checkCode(email, 'password_reset', otp, false);
    if (codeProblem) return fail(codeProblem);

    const [updated] = await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, user.id))
      .returning({ id: users.id });
    if (!updated) return fail('Could not update your password. Please try again.');

    await forgetCode(email, 'password_reset', otp);
    return { success: true, message: 'Password reset successfully! Please log in.' };
  } catch (e) {
    console.error('resetPasswordWithOtp failed', e);
    return fail('Could not reset your password. Please try again.');
  }
}

export async function logout(): Promise<AuthResult> {
  await destroySession();
  revalidatePath('/');
  return { success: true, message: 'Logged out.' };
}
