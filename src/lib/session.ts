import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { db } from '../app/lib/db';
import { users } from '../db/schema';
import type { SessionUser } from './constants';

const COOKIE = 'civic_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const FALLBACK_SECRET = 'civic-tracker-session-signing-fallback-key-not-for-production';
const SESSION_SECRET =
  process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.DATABASE_URL || FALLBACK_SECRET;

if (!process.env.AUTH_SECRET && !process.env.JWT_SECRET) {
  console.warn('AUTH_SECRET is unset; configure it in Vercel to use a dedicated session signing key.');
}

function secretKey() {
  return new TextEncoder().encode(SESSION_SECRET);
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
    const displayName = u.fullName || u.username.charAt(0).toUpperCase() + u.username.slice(1);
    return {
      id: u.id,
      name: u.username,
      displayName,
      role: u.role === 'admin' ? 'admin' : 'user',
      avatarUrl: u.avatarUrl,
    };
  } catch {
    return null;
  }
}
