import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { asc, desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '../../lib/session';
import { db } from '../lib/db';
import { comments, issues } from '../../db/schema';
import { Dashboard } from '../../components/Dashboard';
import { StatsSkeleton } from '../../components/StatsBar';
import { MapSkeleton } from '../../components/MapView';

async function IssuesLoader() {
  await connection(); // request-time rendering, because this page needs the logged-in user

  // Private page: visitors who are not logged in go to the homepage with the login box open
  const user = await getCurrentUser();
  if (!user) redirect('/?login=1');

  // Unapproved (spam-flagged) reports are only visible to admins.
  const query = db.select().from(issues);
  const allIssues = await (user.role === 'admin' ? query : query.where(eq(issues.isApproved, true))).orderBy(
    desc(issues.upvotes)
  );
  const allComments = await db.select().from(comments).orderBy(asc(comments.createdAt));
  return <Dashboard issues={allIssues} comments={allComments} user={user} />;
}

function PageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4">
      <StatsSkeleton />
      <div className="h-14 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-96 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-[420px] lg:col-span-2">
          <MapSkeleton />
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IssuesLoader />
    </Suspense>
  );
}

