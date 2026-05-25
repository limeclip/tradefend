import { NextResponse } from 'next/server';

import type { PositionPlanRow } from '@/lib/guardian/types';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_PAGE_SIZE = 18;
const MAX_PAGE_SIZE = 50;

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parsePositiveInt(url.searchParams.get('page'), 1);
    const pageSize = Math.min(
      parsePositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const skip = (page - 1) * pageSize;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({
        plans: [] satisfies PositionPlanRow[],
        total: 0,
        page,
        pageSize,
      });
    }

    const where = { userId: dbUser.id };

    const [rows, total] = await Promise.all([
      prisma.positionPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.positionPlan.count({ where }),
    ]);

    const plans: PositionPlanRow[] = rows.map((row) => ({
      id: row.id,
      tokenAddress: row.tokenAddress,
      ticker: row.ticker,
      chain: row.chain,
      entryPrice: row.entryPrice,
      positionSizePercent: row.positionSizePercent,
      positionSizeUsdt: row.positionSizeUsdt,
      stopLossPercent: row.stopLossPercent,
      takeProfitPercent: row.takeProfitPercent,
      aiSummary: row.aiSummary,
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json({ plans, total, page, pageSize });
  } catch (err: unknown) {
    console.error('[guardian/plans]', err);
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }
}
