import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function createContext() {
  const start = performance.now();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log(`getSession: ${(performance.now() - start).toFixed(2)}ms`);

  return {
    prisma,
    session,
  };
}

export type GraphQLContext = Awaited<ReturnType<typeof createContext>>;

export function requireUser(context: GraphQLContext) {
  if (!context.session) {
    throw new Error('Unauthorized');
  }

  return context.session.user;
}
