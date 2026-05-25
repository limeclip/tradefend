import { NextResponse } from 'next/server';

import { enrichOpenPositions } from '@/lib/guardian/enrich-positions';
import { canOpenPosition, FREE_MAX_OPEN_POSITIONS } from '@/lib/guardian/position-limits';
import { syncOpenPositionsCount } from '@/lib/guardian/position-sync';
import type { OpenPositionRequest, UserPositionRow } from '@/lib/guardian/types';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const USER_SELECT = {
  id: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  openPositionsCount: true,
} as const;

function parseOpenBody(body: unknown): OpenPositionRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const tokenAddress = typeof b.tokenAddress === 'string' ? b.tokenAddress.trim() : '';
  const entryPrice = typeof b.entryPrice === 'number' ? b.entryPrice : Number(b.entryPrice);
  const stopLossPrice = typeof b.stopLossPrice === 'number' ? b.stopLossPrice : Number(b.stopLossPrice);
  const takeProfitPrice =
    typeof b.takeProfitPrice === 'number' ? b.takeProfitPrice : Number(b.takeProfitPrice);

  if (!tokenAddress) return null;
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) return null;
  if (!Number.isFinite(stopLossPrice) || stopLossPrice <= 0) return null;
  if (!Number.isFinite(takeProfitPrice) || takeProfitPrice <= 0) return null;

  const positionSizePercentRaw =
    b.positionSizePercent === undefined || b.positionSizePercent === null
      ? undefined
      : typeof b.positionSizePercent === 'number'
        ? b.positionSizePercent
        : Number(b.positionSizePercent);

  const positionSizeUsdtRaw =
    b.positionSizeUsdt === undefined || b.positionSizeUsdt === null
      ? undefined
      : typeof b.positionSizeUsdt === 'number'
        ? b.positionSizeUsdt
        : Number(b.positionSizeUsdt);

  return {
    tokenAddress,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    chain: typeof b.chain === 'string' ? b.chain.trim() || undefined : undefined,
    ticker: typeof b.ticker === 'string' ? b.ticker.trim() || undefined : undefined,
    positionSizePercent:
      positionSizePercentRaw !== undefined &&
      Number.isFinite(positionSizePercentRaw) &&
      positionSizePercentRaw > 0
        ? positionSizePercentRaw
        : undefined,
    positionSizeUsdt:
      positionSizeUsdtRaw !== undefined && Number.isFinite(positionSizeUsdtRaw) && positionSizeUsdtRaw > 0
        ? positionSizeUsdtRaw
        : undefined,
    aiPlanId: typeof b.aiPlanId === 'string' ? b.aiPlanId.trim() || undefined : undefined,
  };
}

function toRow(row: {
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
}): UserPositionRow {
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
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ positions: [] satisfies UserPositionRow[] });
    }

    const rows = await prisma.userPosition.findMany({
      where: { userId: dbUser.id, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });

    const positions = await enrichOpenPositions(dbUser.id, rows);

    return NextResponse.json({ positions });
  } catch (err: unknown) {
    console.error('[guardian/positions GET]', err);
    return NextResponse.json({ error: 'Failed to load positions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = parseOpenBody(await request.json().catch(() => null));
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: USER_SELECT,
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const openCount = await syncOpenPositionsCount(dbUser.id);
    const userForLimit = { ...dbUser, openPositionsCount: openCount };

    if (!canOpenPosition(userForLimit, openCount)) {
      return NextResponse.json(
        {
          error: `Maximum open positions for Free plan is ${FREE_MAX_OPEN_POSITIONS}. Upgrade to Pro.`,
        },
        { status: 403 },
      );
    }

    const watchlistItem = await prisma.watchlistItem.findUnique({
      where: {
        userId_tokenAddress: {
          userId: dbUser.id,
          tokenAddress: body.tokenAddress,
        },
      },
      select: { lastRiskLevel: true },
    });

    const position = await prisma.userPosition.create({
      data: {
        userId: dbUser.id,
        tokenAddress: body.tokenAddress,
        ticker: body.ticker ?? null,
        chain: body.chain ?? null,
        entryPrice: body.entryPrice,
        positionSizePercent: body.positionSizePercent ?? null,
        positionSizeUsdt: body.positionSizeUsdt ?? null,
        stopLossPrice: body.stopLossPrice,
        takeProfitPrice: body.takeProfitPrice,
        status: 'OPEN',
        aiPlanId: body.aiPlanId ?? null,
        lastRiskLevel: watchlistItem?.lastRiskLevel ?? null,
        lastPriceUsd: body.entryPrice,
      },
    });

    await syncOpenPositionsCount(dbUser.id);

    const [enriched] = await enrichOpenPositions(dbUser.id, [position]);
    return NextResponse.json({ position: enriched ?? toRow(position) }, { status: 201 });
  } catch (err: unknown) {
    console.error('[guardian/positions POST]', err);
    return NextResponse.json({ error: 'Failed to open position' }, { status: 500 });
  }
}
