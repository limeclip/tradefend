import { fetchDexScreenerTokenPriceUsd } from '@/lib/guardian/dex-price';
import { computePositionLiveMetrics } from '@/lib/guardian/position-metrics';
import type { UserPositionRow } from '@/lib/guardian/types';
import { prisma } from '@/lib/prisma';

type DbPosition = {
  id: string;
  tokenAddress: string;
  ticker: string | null;
  chain: string | null;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSizePercent: number | null;
  positionSizeUsdt: number | null;
  status: string;
  createdAt: Date;
  lastRiskLevel: string | null;
  lastPriceUsd: number | null;
  aiPlanId: string | null;
};

export async function enrichOpenPositions(
  userId: string,
  rows: DbPosition[],
): Promise<UserPositionRow[]> {
  if (rows.length === 0) return [];

  const addresses = [...new Set(rows.map((r) => r.tokenAddress))];

  const watchlistItems = await prisma.watchlistItem.findMany({
    where: {
      userId,
      tokenAddress: { in: addresses },
    },
    select: {
      tokenAddress: true,
      lastRiskLevel: true,
    },
  });

  const riskByAddress = new Map(watchlistItems.map((w) => [w.tokenAddress, w.lastRiskLevel]));

  const priceEntries = await Promise.all(
    addresses.map(async (address) => {
      const row = rows.find((r) => r.tokenAddress === address);
      const cached = row?.lastPriceUsd;
      const fresh = await fetchDexScreenerTokenPriceUsd(address);
      return [address, fresh ?? (cached && cached > 0 ? cached : null)] as const;
    }),
  );

  const priceByAddress = new Map(priceEntries);

  return rows.map((row) => {
    const currentPrice = priceByAddress.get(row.tokenAddress) ?? null;
    const currentRiskLevel =
      riskByAddress.get(row.tokenAddress) ?? row.lastRiskLevel ?? null;

    const live = computePositionLiveMetrics({
      entryPrice: row.entryPrice,
      stopLossPrice: row.stopLossPrice,
      takeProfitPrice: row.takeProfitPrice,
      currentPrice,
      positionSizeUsdt: row.positionSizeUsdt,
    });

    return {
      id: row.id,
      tokenAddress: row.tokenAddress,
      ticker: row.ticker,
      chain: row.chain,
      entryPrice: row.entryPrice,
      stopLossPrice: row.stopLossPrice,
      takeProfitPrice: row.takeProfitPrice,
      positionSizePercent: row.positionSizePercent,
      positionSizeUsdt: row.positionSizeUsdt,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      aiPlanId: row.aiPlanId,
      currentPrice: live.currentPrice,
      currentRiskLevel,
      pnlPercent: live.pnlPercent,
      pnlUsd: live.pnlUsd,
      percentToSl: live.percentToSl,
      percentToTp: live.percentToTp,
      slTpProgress: live.slTpProgress,
    };
  });
}
