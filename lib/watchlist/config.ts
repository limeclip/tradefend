/** Per-plan watchlist limits: max tokens and minimum hours between cron API checks. */
export const WATCHLIST_LIMITS = {
  free: { maxTokens: 8, cacheHours: 6 },
  pro: { maxTokens: 40, cacheHours: 2 },
} as const;

export type WatchlistPlanLimits = {
  maxTokens: number;
  cacheHours: number;
};

export function getWatchlistLimit(plan: string | null): WatchlistPlanLimits {
  const isPro = plan === 'pro_monthly' || plan === 'pro_yearly';
  return isPro ? WATCHLIST_LIMITS.pro : WATCHLIST_LIMITS.free;
}
