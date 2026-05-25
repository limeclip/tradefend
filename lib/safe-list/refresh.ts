import { analyzeToken, isTokenNotFoundError } from '@/lib/risk/analyze-token';
import { prisma } from '@/lib/prisma';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { normalizeTokenAddress } from '@/lib/watchlist/validation';

import { fetchSafeListCandidates } from './candidates';
import { buildReasonFull, buildReasonShort } from './reason';

// Смягчённые критерии отбора
const MIN_LIQUIDITY_SCORE_LOW = 50;      // для LOW риск достаточно ликвидности 50
const MIN_LIQUIDITY_SCORE_MEDIUM = 75;   // для MEDIUM риск нужна высокая ликвидность 75
const MIN_CONCENTRATION_SCORE = 50;      // концентрация >= 50 (вместо 60)
const TARGET_LIST_SIZE = 10;
const MAX_ANALYZE = 50;                  // увеличил до 50, чтобы больше шансов

function passesSafeCriteria(report: TokenRiskReport): boolean {
  const { riskLevel, scores } = report;
  const liq = scores.liquidity;
  const conc = scores.concentration;

  if (riskLevel === 'LOW') {
    return liq > MIN_LIQUIDITY_SCORE_LOW && conc >= MIN_CONCENTRATION_SCORE;
  }
  if (riskLevel === 'MEDIUM') {
    return liq > MIN_LIQUIDITY_SCORE_MEDIUM && conc >= MIN_CONCENTRATION_SCORE;
  }
  return false;
}

export type RefreshSafeListResult = {
  analyzed: number;
  selected: number;
  deleted: number;
};

export async function refreshSafeList(): Promise<RefreshSafeListResult> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deleted = await prisma.curatedToken.deleteMany({
    where: { addedAt: { lt: cutoff } },
  });

  const candidates = await fetchSafeListCandidates(MAX_ANALYZE);
  const selected: Array<{
    tokenAddress: string;
    chain: string;
    ticker: string | null;
    riskScore: number;
    riskLevel: string;
    reasonShort: string;
    reasonFull: string | null;
  }> = [];

  let analyzed = 0;

  for (const candidate of candidates) {
    if (selected.length >= TARGET_LIST_SIZE) break;

    analyzed += 1;
    let report: TokenRiskReport;
    try {
      report = await analyzeToken(candidate.tokenAddress, candidate.chain, {
        skipCreditCheck: true,
      });
    } catch (err) {
      if (isTokenNotFoundError(err)) continue;
      throw err;
    }

    if (!passesSafeCriteria(report)) continue;

    const tokenAddress = report.tokenAddress
      ? normalizeTokenAddress(report.tokenAddress)
      : candidate.tokenAddress;
    const chain = (report.chain ?? candidate.chain).toLowerCase();

    const reasonShort = buildReasonShort(report);
    const reasonFull = await buildReasonFull(report);

    selected.push({
      tokenAddress,
      chain,
      ticker: report.ticker ?? candidate.ticker ?? null,
      riskScore: report.scores.overall,
      riskLevel: report.riskLevel,
      reasonShort,
      reasonFull,
    });
  }

  if (selected.length > 0) {
    await prisma.curatedToken.createMany({
      data: selected.map((row) => ({
        ...row,
        addedBy: 'system',
      })),
      skipDuplicates: true,
    });
  }

  return {
    analyzed,
    selected: selected.length,
    deleted: deleted.count,
  };
}