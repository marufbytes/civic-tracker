import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { db } from '../app/lib/db';
import { users } from '../db/schema';
import type { SessionUser } from './constants';

const COOKIE = 'civic_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be set in production.');
    return new TextEncoder().encode('dev-only-insecure-secret-change-me-please-32b');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Returns the logged-in user (role read fresh from the DB), or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!u) return null;
    return { id: u.id, name: u.username, role: u.role === 'admin' ? 'admin' : 'user', avatarUrl: u.avatarUrl };
  } catch {
    return null;
  }
}


