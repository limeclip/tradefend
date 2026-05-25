import type { TokenRiskReport } from '@/lib/services/risk/types';

import { normalizeTokenAddress } from '@/lib/watchlist/validation';

/** Stable watchlist key: on-chain address when available, otherwise the analysis query (e.g. ticker). */
export function resolveWatchlistTokenAddress(report: TokenRiskReport): string | null {
  const address = report.tokenAddress?.trim();
  if (address) return normalizeTokenAddress(address);

  const query = report.query?.trim();
  if (!query) return null;

  return normalizeTokenAddress(query);
}

export function buildWatchlistPayload(report: TokenRiskReport) {
  const tokenAddress = resolveWatchlistTokenAddress(report);
  if (!tokenAddress) return null;

  return {
    tokenAddress,
    ticker: report.ticker?.trim() || undefined,
    chain: report.chain?.trim() || undefined,
    lastRiskScore: Math.round(report.scores.overall),
    lastRiskLevel: report.riskLevel,
    notes: {
      query: report.query,
      aiSummary: report.aiInsight.summary,
      recommendation: report.aiInsight.recommendation,
    },
  };
}
