import Link from 'next/link';
import { Suspense } from 'react';
import { SafeListPageClient } from '@/components/safe-list/SafeListPageClient';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { isProUser } from '@/lib/subscription/is-pro-user';
import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/watchlist/db-user';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function SafeListFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

export default async function SafeListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await ensureDbUser(user);
  const isPro = isProUser(dbUser);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Curated
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
          Proven Safe List
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Tokens screened for low risk, strong liquidity, and healthier holder distribution. Refreshed daily.
        </p>
      </header>

      {!isPro ? (
        <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
          <CardContent className="space-y-4 px-8 py-12 text-center">
            <p className="text-lg font-medium">Upgrade to Pro</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              The full Proven Safe List with pagination is available on the Pro plan. Free accounts can preview one
              token on the dashboard.
            </p>
            <Link href="/pricing" className={cn(buttonVariants(), 'mt-2 rounded-xl px-8')}>
              View Pro plans
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Suspense fallback={<SafeListFallback />}>
          <SafeListPageClient />
        </Suspense>
      )}
    </div>
  );
}
