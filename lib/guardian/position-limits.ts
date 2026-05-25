import type { User } from '@prisma/client';

/** Free tier: max simultaneously open positions. */
export const FREE_MAX_OPEN_POSITIONS = 2;

export type OpenPositionLimitUser = Pick<
  User,
  'subscriptionPlan' | 'subscriptionStatus' | 'openPositionsCount'
>;

function isProUser(user: OpenPositionLimitUser): boolean {
  const plan = user.subscriptionPlan ?? '';
  return user.subscriptionStatus === 'active' && (plan === 'pro_monthly' || plan === 'pro_yearly');
}

/** Whether the user may open another position right now. */
export function canOpenPosition(user: OpenPositionLimitUser, openCount?: number): boolean {
  if (isProUser(user)) return true;
  const count = openCount ?? user.openPositionsCount;
  return count < FREE_MAX_OPEN_POSITIONS;
}
