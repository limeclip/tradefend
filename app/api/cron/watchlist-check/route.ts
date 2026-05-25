import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { runPositionMonitor, type UserPositionForMonitor } from '@/lib/guardian/position-monitor';
import { runWatchlistCheck, type WatchlistItemForCheck } from '@/lib/watchlist/run-check';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET_TOKEN?.trim();
  if (!secret) {
    return false;
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  // if (!verifyCronAuth(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const rows = await prisma.watchlistItem.findMany({
    select: {
      id: true,
      userId: true,
      tokenAddress: true,
      ticker: true,
      chain: true,
      lastRiskLevel: true,
      lastCheckedAt: true,
      notifyOnChange: true,
      user: {
        select: {
          subscriptionPlan: true,
          telegramChatId: true,
        },
      },
    },
  });

  const items: WatchlistItemForCheck[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    tokenAddress: row.tokenAddress,
    ticker: row.ticker,
    chain: row.chain,
    lastRiskLevel: row.lastRiskLevel,
    lastCheckedAt: row.lastCheckedAt,
    subscriptionPlan: row.user.subscriptionPlan,
    notifyOnChange: row.notifyOnChange,
    user: { telegramChatId: row.user.telegramChatId },
  }));

  const watchlistStats = await runWatchlistCheck(items, {
    skipCache: false,
    forceRefresh: false,
    skipCreditCheck: true,
  });

  const positionRows = await prisma.userPosition.findMany({
    where: { status: 'OPEN' },
    select: {
      id: true,
      userId: true,
      tokenAddress: true,
      ticker: true,
      chain: true,
      stopLossPrice: true,
      takeProfitPrice: true,
      lastRiskLevel: true,
      user: {
        select: { telegramChatId: true },
      },
    },
  });

  const positions: UserPositionForMonitor[] = positionRows.map((row) => ({
    id: row.id,
    userId: row.userId,
    tokenAddress: row.tokenAddress,
    ticker: row.ticker,
    chain: row.chain,
    stopLossPrice: row.stopLossPrice,
    takeProfitPrice: row.takeProfitPrice,
    lastRiskLevel: row.lastRiskLevel,
    user: { telegramChatId: row.user.telegramChatId },
  }));

  const positionStats = await runPositionMonitor(positions);

  return NextResponse.json(
    {
      ok: true,
      itemsTotal: items.length,
      watchlist: watchlistStats,
      positions: positionStats,
    },
    { status: 200 },
  );
}


