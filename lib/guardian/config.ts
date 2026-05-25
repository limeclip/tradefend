/** Guardian (AI Trade Companion) feature configuration. */
export const GUARDIAN_CONFIG = {
  /** Display name shown in the UI. */
  displayName: 'AI Guardian',
  /** Short product label for badges and nav. */
  navLabel: 'Guardian',
  /** Pro plans that unlock Guardian when subscription is active. */
  proPlans: ['pro_monthly', 'pro_yearly'] as const,
} as const;

export type GuardianProPlan = (typeof GUARDIAN_CONFIG.proPlans)[number];
