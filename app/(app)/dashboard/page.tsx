import { Badge } from '@/components/ui/badge';
import { DashboardAnalyzer } from '@/components/dashboard/DashboardAnalyzer';
import { ActivityCalendar } from '@/components/dashboard/activity-calendar';
import { SafeListWidget } from '@/components/dashboard/SafeListWidget';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { StoredCheckRow } from '@/lib/history/build-report-from-check';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, subscriptionPlan: true, subscriptionStatus: true },
  });

  const isPro =
    dbUser?.subscriptionStatus === 'active' &&
    (dbUser?.subscriptionPlan === 'pro_monthly' || dbUser?.subscriptionPlan === 'pro_yearly');

  const recentRows =
    dbUser?.id
      ? await prisma.tokenCheck.findMany({
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
            searchHistory: {
              select: {
                query: true,
              },
            },
          },
        })
      : [];

  const recentChecks: StoredCheckRow[] = recentRows.map((c) => ({
    id: c.id,
    ticker: c.ticker,
    chain: c.chain,
    tokenAddress: c.tokenAddress,
    overallRisk: c.overallRisk,
    createdAt: c.createdAt,
    notes: c.notes,
    query: c.searchHistory?.query ?? null,
  }));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Dashboard
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
          Run your next pre-trade check
        </h1>
        <p className="max-w-2xl text-muted-foreground flex flex-col ">
          <span> Enter a ticker symbol or token contract address.</span>
          <span> You will get the full risk report and a concise AI
          recommendation.</span>
        
        </p>
      </section>

      <div className="max-w-5xl">
        <DashboardAnalyzer recentChecks={recentChecks} isPro={isPro} />
      </div>
      <div className="max-w-5xl">
        <SafeListWidget />
      </div>
      <div className="max-w-5xl">
        <ActivityCalendar />
      </div>
    
    </div>
  );
}
