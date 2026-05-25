import { prisma } from '@/lib/prisma';

/** Reconcile User.openPositionsCount with actual OPEN positions. */
export async function syncOpenPositionsCount(userId: string): Promise<number> {
  const count = await prisma.userPosition.count({
    where: { userId, status: 'OPEN' },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { openPositionsCount: count },
  });

  return count;
}
