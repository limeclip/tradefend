import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  INSUFFICIENT_CREDITS_MESSAGE,
  isInsufficientCreditsError,
} from '@/lib/risk/analyze-token';
import { prisma } from '@/lib/prisma';
import { runWatchlistCheck, type WatchlistItemForCheck } from '@/lib/watchlist/run-check';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Missing watchlist item id' }, { status: 400 });
    }

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

    const row = await prisma.watchlistItem.findFirst({
      where: { id, userId: dbUser.id },
      select: {
        id: true,
        userId: true,
        tokenAddress: true,
        ticker: true,
        chain: true,
        lastRiskLevel: true,
        lastCheckedAt: true,
        notifyOnChange: true,
        user: { select: { telegramChatId: true } },
      },
    });

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const item: WatchlistItemForCheck = {
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
    };

    const stats = await runWatchlistCheck([item], {
      skipCache: true,
      forceRefresh: true,
      skipCreditCheck: false,
    });

    const updated = await prisma.watchlistItem.findUnique({
      where: { id: row.id },
      select: {
        lastRiskScore: true,
        lastRiskLevel: true,
        lastCheckedAt: true,
        ticker: true,
        chain: true,
      },
    });

    return NextResponse.json({
      ok: true,
      stats,
      item: updated
        ? {
            lastRiskScore: updated.lastRiskScore,
            lastRiskLevel: updated.lastRiskLevel,
            lastCheckedAt: updated.lastCheckedAt?.toISOString() ?? null,
            ticker: updated.ticker,
            chain: updated.chain,
          }
        : null,
    });
  } catch (err) {
    if (isInsufficientCreditsError(err)) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}
