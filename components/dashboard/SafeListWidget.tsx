'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CuratedTokenDto } from '@/lib/safe-list/types';
import { buildPublicTokenPagePath } from '@/lib/token/public-url';
import { riskBadgeClass } from '@/lib/watchlist/risk-styles';
import { cn } from '@/lib/utils';

type SafeListResponse = {
  tokens: CuratedTokenDto[];
  limited: boolean;
  isPro: boolean;
  message?: string;
};

export function SafeListWidget() {
  const [data, setData] = React.useState<SafeListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/guardian/safe-list?preview=true', { cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as SafeListResponse | null;
        if (!cancelled && res.ok && json) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            {/* <ShieldCheck className="size-5" strokeWidth={1.5} /> */}
            Proven Safe List
          </CardTitle>
          <p className="text-sm text-muted-foreground">Curated lower-risk tokens, refreshed daily.</p>
        </div>
        <Link href="/safe-list" className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 shrink-0 rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground')}>
          View all
          <ArrowRight className="ml-1 size-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : null}

        {!loading && (data?.tokens.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {data?.message ?? 'Safe list is being refreshed. Check back soon.'}
          </p>
        ) : null}

        {!loading && data?.tokens.length ? (
          <ul className="space-y-3">
            {data.tokens.map((token) => (
              <li
                key={token.id}
                className="flex flex-col gap-2 rounded-xl border border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-sm transition hover:bg-muted/40 dark:hover:bg-sidebar"
              >
                <div className="min-w-0">
                  <p className="font-medium">{token.ticker ?? 'Token'}</p>
                  <p className="truncate text-xs text-muted-foreground">{token.reasonShort}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('rounded-full border-0', riskBadgeClass(token.riskLevel))}>
                    {token.riskLevel}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums">{token.riskScore}/100</span>
                  <Link
                    href={buildPublicTokenPagePath(token.tokenAddress, token.chain)}
                    className="text-xs font-medium underline-offset-2 hover:underline text-muted-foreground hover:text-foreground"
                  >
                    Report
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {data?.limited ? (
          <p className="text-center text-xs text-muted-foreground">
            {data.message ?? 'Upgrade to Pro for the full curated list.'}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
