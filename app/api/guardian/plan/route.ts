import { NextResponse } from 'next/server';

import {
  canBuildPosition,
  incrementPositionCount,
  resetPositionsBuiltIfNeeded,
} from '@/lib/guardian/limits';
import type { PositionPlanSaveRequest } from '@/lib/guardian/types';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const POSITION_LIMIT_SELECT = {
  id: true,
  positionsBuiltToday: true,
  positionsBuiltDate: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
} as const;

function parseBody(body: unknown): PositionPlanSaveRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const tokenAddress = typeof b.tokenAddress === 'string' ? b.tokenAddress.trim() : '';
  const entryPrice = typeof b.entryPrice === 'number' ? b.entryPrice : Number(b.entryPrice);
  const positionSizePercent =
    typeof b.positionSizePercent === 'number' ? b.positionSizePercent : Number(b.positionSizePercent);
  const stopLossPercent =
    typeof b.stopLossPercent === 'number' ? b.stopLossPercent : Number(b.stopLossPercent);
  const takeProfitPercent =
    typeof b.takeProfitPercent === 'number' ? b.takeProfitPercent : Number(b.takeProfitPercent);
  const aiSummary = typeof b.aiSummary === 'string' ? b.aiSummary.trim() : '';

  if (!tokenAddress || !aiSummary) return null;
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) return null;
  if (!Number.isFinite(positionSizePercent) || positionSizePercent <= 0) return null;
  if (!Number.isFinite(stopLossPercent) || stopLossPercent <= 0) return null;
  if (!Number.isFinite(takeProfitPercent) || takeProfitPercent <= 0) return null;

  const positionSizeUsdtRaw =
    b.positionSizeUsdt === undefined || b.positionSizeUsdt === null
      ? undefined
      : typeof b.positionSizeUsdt === 'number'
        ? b.positionSizeUsdt
        : Number(b.positionSizeUsdt);

  return {
    tokenAddress,
    entryPrice,
    positionSizePercent,
    stopLossPercent,
    takeProfitPercent,
    aiSummary,
    chain: typeof b.chain === 'string' ? b.chain.trim() || undefined : undefined,
    ticker: typeof b.ticker === 'string' ? b.ticker.trim() || undefined : undefined,
    positionSizeUsdt:
      positionSizeUsdtRaw !== undefined && Number.isFinite(positionSizeUsdtRaw) && positionSizeUsdtRaw > 0
        ? positionSizeUsdtRaw
        : undefined,
  };
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

    const body = parseBody(await request.json().catch(() => null));
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: POSITION_LIMIT_SELECT,
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await resetPositionsBuiltIfNeeded(dbUser);

    const userForLimit = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: POSITION_LIMIT_SELECT,
    });

    if (!userForLimit || !canBuildPosition(userForLimit)) {
      return NextResponse.json(
        { error: 'Daily position limit reached. Upgrade to Pro.' },
        { status: 403 },
      );
    }

    const plan = await prisma.positionPlan.create({
      data: {
        userId: dbUser.id,
        tokenAddress: body.tokenAddress,
        ticker: body.ticker ?? null,
        chain: body.chain ?? null,
        entryPrice: body.entryPrice,
        positionSizePercent: body.positionSizePercent,
        positionSizeUsdt: body.positionSizeUsdt ?? null,
        stopLossPercent: body.stopLossPercent,
        takeProfitPercent: body.takeProfitPercent,
        aiSummary: body.aiSummary,
      },
    });

    await incrementPositionCount(dbUser.id);

    return NextResponse.json({ planId: plan.id, success: true });
  } catch (err: unknown) {
    console.error('[guardian/plan]', err);
    return NextResponse.json({ error: 'Failed to save position plan' }, { status: 500 });
  }
}
