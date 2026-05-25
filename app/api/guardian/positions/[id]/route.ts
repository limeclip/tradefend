import { NextResponse } from 'next/server';

import { syncOpenPositionsCount } from '@/lib/guardian/position-sync';
import type { UserPositionRow } from '@/lib/guardian/types';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const status = body?.status === 'CLOSED' ? 'CLOSED' : null;
    if (!status) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.userPosition.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    if (existing.status === 'CLOSED') {
      return NextResponse.json({ position: toRow(existing) });
    }

    const now = new Date();
    const updated = await prisma.userPosition.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: now,
      },
    });

    await syncOpenPositionsCount(dbUser.id);

    return NextResponse.json({ position: toRow(updated) });
  } catch (err: unknown) {
    console.error('[guardian/positions PATCH]', err);
    return NextResponse.json({ error: 'Failed to close position' }, { status: 500 });
  }
}
