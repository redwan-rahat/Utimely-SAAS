import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import SignOutButton from './sign-out-button';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth');
  }
  

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-4">
        Welcome, <strong>{session.user.name}</strong>
      </p>

      <p className="text-gray-500">{session.user.email}</p>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}