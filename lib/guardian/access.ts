import { GUARDIAN_CONFIG } from '@/lib/guardian/config';
import type { GuardianStatus, GuardianUserAccess } from '@/lib/guardian/types';

function isProSubscription(user: GuardianUserAccess): boolean {
  const plan = user.subscriptionPlan ?? '';
  const isProPlan = (GUARDIAN_CONFIG.proPlans as readonly string[]).includes(plan);
  return user.subscriptionStatus === 'active' && isProPlan;
}

/**
 * Whether the user can use AI Guardian.
 * Access is granted via explicit `guardianEnabled` flag or an active Pro subscription.
 */
export function isGuardianEnabled(user: GuardianUserAccess): boolean {
  if (user.guardianEnabled) return true;
  return isProSubscription(user);
}

/** Resolves how Guardian access was granted (for UI and API responses). */
export function getGuardianStatus(user: GuardianUserAccess): GuardianStatus {
  if (user.guardianEnabled) {
    return { enabled: true, source: 'flag' };
  }
  if (isProSubscription(user)) {
    return { enabled: true, source: 'subscription' };
  }
  return { enabled: false, source: 'none' };
}
