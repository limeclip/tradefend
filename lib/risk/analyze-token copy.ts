import { analyzeToken as analyzeTokenCore } from '@/lib/services/risk/risk.service';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { prisma } from '@/lib/prisma';
import {
  canPerformCheck,
  incrementCheckCount,
  resetMonthlyCheckCountIfNeeded,
} from '@/lib/subscription/limits';

export type AnalysisResult = TokenRiskReport;

const USER_LIMIT_SELECT = {
  id: true,
  checksUsedThisMonth: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  monthlyResetDate: true,
} as const;

export type AnalyzeTokenOptions = {
  forceRefresh?: boolean;
  userId?: string;
  skipCreditCheck?: boolean;
  recordActivity?: boolean; // NEW
};

export class InsufficientCreditsError extends Error {
  readonly code = 'INSUFFICIENT_CREDITS' as const;

  constructor() {
    super('INSUFFICIENT_CREDITS');
    this.name = 'InsufficientCreditsError';
  }
}

function buildQuery(address: string, chain?: string): string {
  const trimmed = address.trim();
  if (!trimmed) {
    throw new Error('Missing address');
  }
  if (chain?.trim() && trimmed.startsWith('0x')) {
    return trimmed;
  }
  return trimmed;
}

async function consumeCredit(userId: string): Promise<void> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_LIMIT_SELECT,
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  await resetMonthlyCheckCountIfNeeded(dbUser);

  const userForLimit = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_LIMIT_SELECT,
  });

  if (!userForLimit || !canPerformCheck(userForLimit)) {
    throw new InsufficientCreditsError();
  }

  await incrementCheckCount(userForLimit);
}

/**
 * Shared risk analysis entry point for API routes, cron, and watchlist refresh.
 * Charges 1 credit per call when `userId` is set and `skipCreditCheck` is not true.
 */
export async function analyzeToken(
  address: string,
  chain?: string,
  options?: AnalyzeTokenOptions,
): Promise<AnalysisResult> {
  const query = buildQuery(address, chain);
  const userId = options?.userId;
  const skipCreditCheck = options?.skipCreditCheck === true;

  if (userId && !skipCreditCheck) {
    await consumeCredit(userId);
  }

  return analyzeTokenCore(query, { forceRefresh: options?.forceRefresh ?? false });
}

export function isTokenNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown };
  return e.code === 'TOKEN_NOT_FOUND' || e.message === 'TOKEN_NOT_FOUND';
}

export function isInsufficientCreditsError(err: unknown): boolean {
  if (err instanceof InsufficientCreditsError) return true;
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown };
  return e.code === 'INSUFFICIENT_CREDITS' || e.message === 'INSUFFICIENT_CREDITS';
}

export const INSUFFICIENT_CREDITS_MESSAGE = 'Monthly limit reached. Upgrade to Pro.';
