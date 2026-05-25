import type { User } from '@prisma/client';

import { prisma } from '@/lib/prisma';

/** Free tier: max saved position plans per calendar day (UTC). */
export const FREE_DAILY_POSITION_PLAN_LIMIT = 3;

const POSITION_LIMIT_SELECT = {
  id: true,
  positionsBuiltToday: true,
  positionsBuiltDate: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
} as const;

export type PositionLimitUser = Pick<
  User,
  'id' | 'positionsBuiltToday' | 'positionsBuiltDate' | 'subscriptionPlan' | 'subscriptionStatus'
>;

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function isProUser(user: Pick<User, 'subscriptionPlan' | 'subscriptionStatus'>): boolean {
  const plan = user.subscriptionPlan ?? '';
  return (
    user.subscriptionStatus === 'active' && (plan === 'pro_monthly' || plan === 'pro_yearly')
  );
}

/** Resets daily position counter when the stored date is not today (UTC). */
export async function resetPositionsBuiltIfNeeded(
  user: Pick<User, 'id' | 'positionsBuiltDate' | 'positionsBuiltToday'>,
): Promise<void> {
  const now = new Date();
  if (user.positionsBuiltDate && isSameUtcDay(user.positionsBuiltDate, now)) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      positionsBuiltToday: 0,
      positionsBuiltDate: now,
    },
  });
}

/**
 * Whether the user may save another position plan today.
 * Pro subscribers: unlimited. Free: up to {@link FREE_DAILY_POSITION_PLAN_LIMIT} per day.
 */
export function canBuildPosition(user: PositionLimitUser): boolean {
  if (isProUser(user)) return true;

  const now = new Date();
  if (!user.positionsBuiltDate || !isSameUtcDay(user.positionsBuiltDate, now)) {
    return true;
  }

  return user.positionsBuiltToday < FREE_DAILY_POSITION_PLAN_LIMIT;
}

/** Increments the daily saved-plan counter (call after a successful save). */
export async function incrementPositionCount(userId: string): Promise<void> {
  const now = new Date();
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: POSITION_LIMIT_SELECT,
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  await resetPositionsBuiltIfNeeded(dbUser);

  const fresh = await prisma.user.findUnique({
    where: { id: userId },
    select: POSITION_LIMIT_SELECT,
  });

  if (!fresh) {
    throw new Error('User not found');
  }

  const shouldReset = !fresh.positionsBuiltDate || !isSameUtcDay(fresh.positionsBuiltDate, now);

  if (shouldReset) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        positionsBuiltToday: 1,
        positionsBuiltDate: now,
      },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      positionsBuiltToday: { increment: 1 },
    },
  });
}
