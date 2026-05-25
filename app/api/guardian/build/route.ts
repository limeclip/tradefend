import { NextResponse } from 'next/server';

import {
  analyzeToken,
  INSUFFICIENT_CREDITS_MESSAGE,
  isInsufficientCreditsError,
  isTokenNotFoundError,
} from '@/lib/risk/analyze-token';
import { generatePositionRecommendations } from '@/lib/guardian/position-recommendations';
import type { PositionBuildRequest, PositionSizeType } from '@/lib/guardian/types';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

function parseBody(body: unknown): PositionBuildRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const tokenAddress = typeof b.tokenAddress === 'string' ? b.tokenAddress.trim() : '';
  const currentPrice = typeof b.currentPrice === 'number' ? b.currentPrice : Number(b.currentPrice);
  const positionSizeValue =
    typeof b.positionSizeValue === 'number' ? b.positionSizeValue : Number(b.positionSizeValue);
  const positionSizeType = b.positionSizeType === 'percent' || b.positionSizeType === 'usdt'
    ? (b.positionSizeType as PositionSizeType)
    : null;

  if (!tokenAddress || !Number.isFinite(currentPrice) || currentPrice <= 0) return null;
  if (!Number.isFinite(positionSizeValue) || positionSizeValue <= 0) return null;
  if (!positionSizeType) return null;

  const takeProfitPercent =
    b.takeProfitPercent === undefined || b.takeProfitPercent === null
      ? undefined
      : typeof b.takeProfitPercent === 'number'
        ? b.takeProfitPercent
        : Number(b.takeProfitPercent);

  return {
    tokenAddress,
    currentPrice,
    positionSizeValue,
    positionSizeType,
    chain: typeof b.chain === 'string' ? b.chain.trim() || undefined : undefined,
    ticker: typeof b.ticker === 'string' ? b.ticker.trim() || undefined : undefined,
    takeProfitPercent:
      takeProfitPercent !== undefined && Number.isFinite(takeProfitPercent) && takeProfitPercent > 0
        ? takeProfitPercent
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
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const report = await analyzeToken(body.tokenAddress, body.chain, {
      forceRefresh: true,
      userId: dbUser.id,
    });

    const result = await generatePositionRecommendations({
      tokenAddress: body.tokenAddress,
      chain: body.chain ?? report.chain,
      ticker: body.ticker ?? report.ticker,
      currentPrice: body.currentPrice,
      positionSizeValue: body.positionSizeValue,
      positionSizeType: body.positionSizeType,
      takeProfitPercent: body.takeProfitPercent,
      report,
    });

    await prisma.userActivity.create({
      data: {
        userId: dbUser.id,
        type: 'position_builder',
        address: body.tokenAddress,
        metadata: {
          riskLevel: report.riskLevel,
          planId: result.planId,
        },
      },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (isInsufficientCreditsError(err)) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 403 });
    }
    if (isTokenNotFoundError(err)) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    console.error('[guardian/build]', err);
    return NextResponse.json({ error: 'Failed to generate position plan' }, { status: 500 });
  }
}
