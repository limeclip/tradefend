import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { HistoryList } from '@/components/history/HistoryList';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { StoredCheckRow } from '@/lib/history/build-report-from-check';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = v ? Number.parseInt(v, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseQ(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === 'string' ? v.trim() : '';
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const q = parseQ(sp.q);
  const page = parsePage(sp.page);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, subscriptionPlan: true, subscriptionStatus: true },
  });

  const isPro =
    dbUser?.subscriptionStatus === 'active' &&
    (dbUser?.subscriptionPlan === 'pro_monthly' || dbUser?.subscriptionPlan === 'pro_yearly');

  if (!dbUser?.id) {
    return (
      <div className="space-y-8">
        <header className="space-y-3">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
            History
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">Your checks</h1>
          <p className="max-w-2xl text-muted-foreground">
            Run an analysis from the dashboard to build your history.
          </p>
        </header>
        <HistoryList checks={[]} total={0} page={1} pageSize={PAGE_SIZE} q="" isPro={false} />
      </div>
    );
  }

  const whereBase = {
    userId: dbUser.id,
    ...(q
      ? {
          OR: [
            { ticker: { contains: q, mode: 'insensitive' as const } },
            { tokenAddress: { contains: q, mode: 'insensitive' as const } },
            { searchHistory: { query: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const total = await prisma.tokenCheck.count({ where: whereBase });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const rows = await prisma.tokenCheck.findMany({
    where: whereBase,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
  });

  const checks: StoredCheckRow[] = rows.map((c) => ({
    id: c.id,
    ticker: c.ticker,
    chain: c.chain,
    tokenAddress: c.tokenAddress,
    overallRisk: c.overallRisk,
    createdAt: c.createdAt.toISOString(),
    query: c.searchHistory?.query ?? null,
    notes: c.notes,
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          History
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">Your checks</h1>
        <p className="max-w-2xl text-muted-foreground">
          Open a saved risk report or remove entries you no longer need.
        </p>
      </header>

      <HistoryList checks={checks} total={total} page={safePage} pageSize={PAGE_SIZE} q={q} isPro={isPro} />
    </div>
  );
}
