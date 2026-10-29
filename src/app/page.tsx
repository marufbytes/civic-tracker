import { Suspense } from 'react';
import { connection } from 'next/server';
import { and, count, desc, eq, ne } from 'drizzle-orm';
import { db } from './lib/db';
import { issues, users } from '../db/schema';
import { getCurrentUser } from '../lib/session';
import { ensureAdmin } from '../lib/admin-seed';
import { LandingPage } from '../components/LandingPage';

async function HomeLoader() {
  await connection();
  await ensureAdmin();

  const user = await getCurrentUser();

  const allIssues = await db
    .select()
    .from(issues)
    .where(eq(issues.isApproved, true))
    .orderBy(desc(issues.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(issues).where(eq(issues.isApproved, true));
  const [{ solved }] = await db
    .select({ solved: count() })
    .from(issues)
    .where(and(eq(issues.isApproved, true), eq(issues.status, 'Resolved')));
  const [{ citizens }] = await db.select({ citizens: count() }).from(users).where(ne(users.role, 'admin'));

  return (
    <LandingPage
      user={user}
      issues={allIssues}
      stats={{ solved, active: total - solved, citizens }}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <HomeLoader />
    </Suspense>
  );
}