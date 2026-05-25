import type { TokenMarketData } from '@/lib/token-cache/market-data';
import type { TokenRiskReport } from '@/lib/services/risk/types';

type SerializedReport = Omit<TokenRiskReport, 'analyzedAt'> & { analyzedAt: string };

export type TokenCachePayload = {
  report: SerializedReport;
  marketData?: TokenMarketData | null;
};

function isEnvelope(
  raw: Record<string, unknown>,
): raw is { report: unknown; marketData?: unknown } {
  return raw.report !== undefined && typeof raw.report === 'object';
}

export function serializeTokenCachePayload(
  report: TokenRiskReport,
  marketData?: TokenMarketData | null,
): TokenCachePayload {
  return {
    report: serializeTokenRiskReport(report),
    ...(marketData !== undefined ? { marketData } : {}),
  };
}

export function serializeTokenRiskReport(report: TokenRiskReport): SerializedReport {
  return {
    ...report,
    analyzedAt: report.analyzedAt.toISOString(),
  };
}

export function deserializeTokenRiskReport(raw: unknown): TokenRiskReport | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const reportRaw = isEnvelope(record) ? record.report : raw;

  if (!reportRaw || typeof reportRaw !== 'object') return null;
  const data = reportRaw as SerializedReport;
  if (typeof data.query !== 'string' || !data.scores || !data.aiInsight) {
    return null;
  }
  const analyzedAt =
    typeof data.analyzedAt === 'string' ? new Date(data.analyzedAt) : new Date();
  if (Number.isNaN(analyzedAt.getTime())) {
    return null;
  }
  return {
    ...data,
    analyzedAt,
  } as TokenRiskReport;
}

export function deserializeTokenMarketData(raw: unknown): TokenMarketData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as TokenMarketData;
  if (
    typeof data.priceUsd !== 'number' ||
    typeof data.liquidityUsd !== 'number' ||
    typeof data.volume24hUsd !== 'number' ||
    typeof data.pairsCount !== 'number' ||
    typeof data.fetchedAt !== 'string'
  ) {
    return null;
  }
  return data;
}

export function deserializeTokenCachePayload(raw: unknown): {
  report: TokenRiskReport | null;
  marketData: TokenMarketData | null;
} {
  if (!raw || typeof raw !== 'object') {
    return { report: null, marketData: null };
  }

  const record = raw as Record<string, unknown>;
  if (isEnvelope(record)) {
    return {
      report: deserializeTokenRiskReport(record),
      marketData: deserializeTokenMarketData(record.marketData),
    };
  }

  return {
    report: deserializeTokenRiskReport(raw),
    marketData: null,
  };
}
