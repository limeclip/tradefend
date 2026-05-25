import { FREE_DAILY_POSITION_PLAN_LIMIT } from '@/lib/guardian/limits';
import { FREE_MAX_OPEN_POSITIONS } from '@/lib/guardian/position-limits';
import { WATCHLIST_LIMITS } from '@/lib/watchlist/config';

export type PricingFeature = {
  label: string;
  included: boolean;
};

export const FREE_PLAN_FEATURES: PricingFeature[] = [
  { label: '5 risk checks per month', included: true },
  { label: `Watchlist — up to ${WATCHLIST_LIMITS.free.maxTokens} tokens`, included: true },
  { label: 'Compare 2–5 tokens', included: true },
  { label: `${FREE_DAILY_POSITION_PLAN_LIMIT} position plans per day`, included: true },
  { label: `Up to ${FREE_MAX_OPEN_POSITIONS} open Guardian positions`, included: true },
  { label: '1 weekly AI insight', included: true },
  { label: 'Favorites', included: false },
  { label: 'Shareable risk pages & Proven Safe List', included: false },
  { label: 'Priority support', included: false },
];

export const PRO_PLAN_FEATURES: PricingFeature[] = [
  { label: '1,000 risk checks per month', included: true },
  { label: `Watchlist — up to ${WATCHLIST_LIMITS.pro.maxTokens} tokens`, included: true },
  { label: 'Compare 2–5 tokens', included: true },
  { label: 'Unlimited position plans', included: true },
  { label: 'Unlimited Guardian positions', included: true },
  { label: 'Unlimited weekly AI insights', included: true },
  { label: 'Favorites & shareable risk pages', included: true },
  { label: 'Proven Safe List (full curated list)', included: true },
  { label: 'Priority support', included: true },
];
