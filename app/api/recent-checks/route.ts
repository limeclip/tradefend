import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser?.id) {
      return NextResponse.json({ items: [], hasMore: false }, { status: 200 });
    }

    const [items, total] = await Promise.all([
      prisma.tokenCheck.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          ticker: true,
          chain: true,
          tokenAddress: true,
          overallRisk: true,
          createdAt: true,
          notes: true,
          searchHistory: { select: { query: true } },
        },
      }),
      prisma.tokenCheck.count({ where: { userId: dbUser.id } }),
    ]);

    return NextResponse.json(
      {
        items: items.map((c) => ({
          id: c.id,
          ticker: c.ticker,
          chain: c.chain,
          tokenAddress: c.tokenAddress,
          overallRisk: c.overallRisk,
          createdAt: c.createdAt,
          notes: c.notes,
          query: c.searchHistory?.query ?? null,
        })),
        hasMore: total > 10,
      },
      { status: 200 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load recent checks' }, { status: 500 });
  }
}

