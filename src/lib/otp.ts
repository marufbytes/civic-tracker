import 'server-only';
import { randomInt } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { db } from '../app/lib/db';
import { otpCodes } from '../db/schema';

const CODE_LIFETIME = 5 * 60 * 1000; // 5 minutes
const RESEND_WAIT = 30 * 1000; // 30 seconds
const MAX_WRONG_TRIES = 5;

export type Purpose = 'signup' | 'profile';

/** Saves a new 6-digit code. Returns the code, or an error message. */
export async function createCode(identifier: string, purpose: Purpose): Promise<{ code: string } | { error: string }> {
  const [latest] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.identifier, identifier), eq(otpCodes.purpose, purpose)))
    .orderBy(desc(otpCodes.expiresAt))
    .limit(1);

  const age = latest ? CODE_LIFETIME - (latest.expiresAt.getTime() - Date.now()) : Infinity;
  if (age < RESEND_WAIT) return { error: 'Please wait a few seconds before asking for another code.' };

  const code = String(randomInt(0, 1000000)).padStart(6, '0');
  await db.delete(otpCodes).where(and(eq(otpCodes.identifier, identifier), eq(otpCodes.purpose, purpose)));
  await db.insert(otpCodes).values({
    identifier,
    purpose,
    code,
    expiresAt: new Date(Date.now() + CODE_LIFETIME),
  });
  return { code };
}

/** Checks a code the user typed. Returns null when it is correct, otherwise an error message. */
export async function checkCode(identifier: string, purpose: Purpose, code: string): Promise<string | null> {
  const [saved] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.identifier, identifier), eq(otpCodes.purpose, purpose)))
    .orderBy(desc(otpCodes.expiresAt))
    .limit(1);

  if (!saved || saved.expiresAt.getTime() < Date.now()) return 'The code has expired. Please ask for a new one.';

  if (saved.code !== code.trim()) {
    if (saved.attempts + 1 >= MAX_WRONG_TRIES) {
      await db.delete(otpCodes).where(eq(otpCodes.id, saved.id));
      return 'Too many wrong tries. Please ask for a new code.';
    }
    await db
      .update(otpCodes)
      .set({ attempts: saved.attempts + 1 })
      .where(eq(otpCodes.id, saved.id));
    return 'That code is not correct.';
  }

  await db.delete(otpCodes).where(eq(otpCodes.id, saved.id));
  return null;
}

/** Emails the code through Gmail SMTP. Returns true if the email was sent. */
export async function sendCode(to: string, code: string): Promise<boolean> {
  const smtpUser = process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_PASSWORD;
  if (!smtpUser || !smtpPass) {
    console.error('SMTP_EMAIL and SMTP_PASSWORD are not set in .env');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: smtpUser, pass: smtpPass } });
    await transporter.sendMail({
      from: `"Civic Issue Tracker" <${smtpUser}>`,
      to,
      subject: 'Your verification code',
      text: `Your verification code is ${code}. It expires in 5 minutes.`,
    });
    return true;
  } catch (error) {
    console.error('Could not send email', error);
    return false;
  }
}


/** Removes saved codes, e.g. when the email could not be sent. */
export async function forgetCode(identifier: string, purpose: Purpose) {
  await db.delete(otpCodes).where(and(eq(otpCodes.identifier, identifier), eq(otpCodes.purpose, purpose)));
}
