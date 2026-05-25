import { redirect } from 'next/navigation';
import { SectionInfoButton } from '@/components/help/SectionInfoButton';
import { Badge } from '@/components/ui/badge';
import { WatchlistList, type WatchlistRow } from '@/components/watchlist/WatchlistList';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getWatchlistLimit } from '@/lib/watchlist/config';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 5;

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function WatchlistPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, subscriptionPlan: true },
  });

  const totalItems = dbUser?.id
    ? await prisma.watchlistItem.count({ where: { userId: dbUser.id } })
    : 0;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const rows = dbUser?.id
    ? await prisma.watchlistItem.findMany({
        where: { userId: dbUser.id },
        orderBy: { addedAt: 'desc' },
        skip: offset,
        take: PAGE_SIZE,
        select: {
          id: true,
          tokenAddress: true,
          ticker: true,
          chain: true,
          addedAt: true,
          lastCheckedAt: true,
          lastRiskScore: true,
          lastRiskLevel: true,
          notifyOnChange: true,
        },
      })
    : [];

  const { maxTokens } = getWatchlistLimit(dbUser?.subscriptionPlan ?? null);
  const tokensUsed = totalItems;
  const tokensRemaining = Math.max(0, maxTokens - tokensUsed);

  const items: WatchlistRow[] = rows.map((r) => ({
    id: r.id,
    tokenAddress: r.tokenAddress,
    ticker: r.ticker,
    chain: r.chain,
    addedAt: r.addedAt.toISOString(),
    lastCheckedAt: r.lastCheckedAt?.toISOString() ?? null,
    lastRiskScore: r.lastRiskScore,
    lastRiskLevel: r.lastRiskLevel,
    notifyOnChange: r.notifyOnChange,
  }));

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Watchlist
        </Badge>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
            Smart watchlist
          </h1>
          <SectionInfoButton section="watchlist" className="mt-1 cursor-pointer" />
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Tokens you are tracking. Risk scores update when you add tokens from an analysis report.
        </p>
      </header>

      <WatchlistList
        items={items}
        tokensUsed={tokensUsed}
        tokensRemaining={tokensRemaining}
        maxTokens={maxTokens}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
      />
    </div>
  );
}