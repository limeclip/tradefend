import type { Prisma } from '@prisma/client';

import type { QuickDecision } from '@/lib/services/risk/quick-decision';
import { quickDecisionFromReport } from '@/lib/services/risk/quick-decision';
import type { TokenRiskReport } from '@/lib/services/risk/types';

export type StoredCheckRow = {
  id: string;
  ticker: string | null;
  chain: string | null;
  tokenAddress: string | null;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  createdAt: string | Date;
  query: string | null;
  notes: Prisma.JsonValue | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTokenRiskNotes(
  value: unknown,
): value is { aiInsight: unknown; scores: unknown; data: unknown; quickDecision?: unknown } {
  if (!isRecord(value)) return false;
  return 'aiInsight' in value && 'scores' in value && 'data' in value;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function parseStoredQuickDecision(value: unknown): QuickDecision | undefined {
  if (!isRecord(value)) return undefined;
  const level = value.level;
  const text = value.text;
  if (
    (level === 'LOW' || level === 'MEDIUM' || level === 'HIGH' || level === 'CRITICAL') &&
    typeof text === 'string' &&
    text.trim()
  ) {
    return { level, text: text.trim() };
  }
  return undefined;
}

export function buildReportFromCheck(check: StoredCheckRow): TokenRiskReport | null {
  if (!check.notes || !isTokenRiskNotes(check.notes)) return null;

  const notes = check.notes as Record<string, unknown>;
  const scores = notes.scores;
  const data = notes.data;
  const aiInsight = notes.aiInsight;
  const storedQuickDecision = notes.quickDecision;

  if (!isRecord(scores) || !isRecord(data) || !isRecord(aiInsight)) return null;
  if (typeof scores.overall !== 'number') return null;

  const report: TokenRiskReport = {
    query: check.query ?? check.ticker ?? check.tokenAddress ?? 'unknown',
    tokenAddress: check.tokenAddress ?? undefined,
    chain: check.chain ?? undefined,
    ticker: check.ticker ?? undefined,
    name: undefined,
    scores: scores as TokenRiskReport['scores'],
    riskLevel: (check.overallRisk as TokenRiskReport['riskLevel']) ?? 'MEDIUM',
    data: data as TokenRiskReport['data'],
    aiInsight: aiInsight as TokenRiskReport['aiInsight'],
    quickDecision: parseStoredQuickDecision(storedQuickDecision),
    analyzedAt: toDate(check.createdAt),
  };

  report.quickDecision = report.quickDecision ?? quickDecisionFromReport(report);

  return report;
}
