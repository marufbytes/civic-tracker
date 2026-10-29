import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { users } from '../../db/schema';
import { getCurrentUser } from '../../lib/session';
import { ProfilePage } from '../../components/ProfilePage';

async function ProfileLoader() {
  await connection();

  // Private page: visitors who are not logged in go to the homepage with the login box open
  const user = await getCurrentUser();
  if (!user) redirect('/?login=1');

  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const profile = {
    username: row.username,
    email: row.email,
    phone: row.phone,
    fullName: row.fullName,
    address: row.address,
    occupation: row.occupation,
    gender: row.gender,
    avatarUrl: row.avatarUrl,
  };
  return <ProfilePage user={user} profile={profile} />;
}

export default function Profile() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-zinc-500">Loading your account...</p>}>
      <ProfileLoader />
    </Suspense>
  );
}
