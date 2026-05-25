import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  INSUFFICIENT_CREDITS_MESSAGE,
  isInsufficientCreditsError,
} from '@/lib/risk/analyze-token';
import { runWatchlistCheck, type WatchlistItemForCheck } from '@/lib/watchlist/run-check';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true, subscriptionPlan: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rows = await prisma.watchlistItem.findMany({
      where: { userId: dbUser.id },
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
          select: { telegramChatId: true },
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
      subscriptionPlan: dbUser.subscriptionPlan,
      notifyOnChange: row.notifyOnChange,
      user: { telegramChatId: row.user.telegramChatId },
    }));

    const stats = await runWatchlistCheck(items, {
      skipCache: true,
      forceRefresh: true,
      skipCreditCheck: false,
    });

    return NextResponse.json(
      {
        ok: true,
        ...stats,
      },
      { status: 200 },
    );
  } catch (err) {
    if (isInsufficientCreditsError(err)) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to refresh watchlist' }, { status: 500 });
  }
}
