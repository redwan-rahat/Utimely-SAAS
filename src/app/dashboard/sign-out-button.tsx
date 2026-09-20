'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();

    router.push('/auth');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded bg-black px-4 py-2 text-white"
    >
      Sign Out
    </button>
  );
}