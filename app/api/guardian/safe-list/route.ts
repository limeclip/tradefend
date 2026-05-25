import { NextResponse } from 'next/server';

import type { CuratedTokenDto } from '@/lib/safe-list/types';
import { prisma } from '@/lib/prisma';
import { isProUser } from '@/lib/subscription/is-pro-user';
import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/watchlist/db-user';

export const dynamic = 'force-dynamic';

function toDto(row: {
  id: string;
  tokenAddress: string;
  chain: string;
  ticker: string | null;
  riskScore: number;
  riskLevel: string;
  reasonShort: string;
  reasonFull: string | null;
  addedAt: Date;
}): CuratedTokenDto {
  return {
    id: row.id,
    tokenAddress: row.tokenAddress,
    chain: row.chain,
    ticker: row.ticker,
    riskScore: row.riskScore,
    riskLevel: row.riskLevel,
    reasonShort: row.reasonShort,
    reasonFull: row.reasonFull,
    addedAt: row.addedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await ensureDbUser(user);
  const isPro = isProUser(dbUser);

  const { searchParams } = new URL(request.url);
  const isPreview = searchParams.get('preview') === 'true';

  if (isPreview) {
    const take = isPro ? 3 : 1;
    const rows = await prisma.curatedToken.findMany({
      orderBy: [{ riskScore: 'desc' }, { addedAt: 'desc' }],
      take,
    });

    return NextResponse.json({
      tokens: rows.map(toDto),
      limited: !isPro,
      isPro,
      message: !isPro ? 'More tokens available on Pro plan.' : undefined,
    });
  }

  if (!isPro) {
    return NextResponse.json(
      { error: 'Pro subscription required', code: 'PRO_REQUIRED' },
      { status: 403 },
    );
  }

  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '10', 10) || 10));
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    prisma.curatedToken.findMany({
      orderBy: [{ riskScore: 'desc' }, { addedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.curatedToken.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    tokens: rows.map(toDto),
    limited: false,
    isPro: true,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
