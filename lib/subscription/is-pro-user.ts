import { GUARDIAN_CONFIG } from '@/lib/guardian/config';

export function isProUser(user: {
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
}): boolean {
  const plan = user.subscriptionPlan ?? '';
  const isProPlan = (GUARDIAN_CONFIG.proPlans as readonly string[]).includes(plan);
  return user.subscriptionStatus === 'active' && isProPlan;
}
