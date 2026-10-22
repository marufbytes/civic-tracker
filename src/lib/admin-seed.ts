import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '../app/lib/db';
import { users } from '../db/schema';
import { hashPassword } from './password';

/** Makes sure the default admin account (admin / admin) exists. Safe to call many times. */
export async function ensureAdmin() {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, 'admin')).limit(1);
  if (existing) return;

  await db
    .insert(users)
    .values({
      username: 'admin',
      passwordHash: hashPassword('admin'),
      email: 'admin@civic.local',
      phone: '0000000000',
      role: 'admin',
    })
    .onConflictDoNothing();
}

