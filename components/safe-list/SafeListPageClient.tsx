'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CuratedTokenDto } from '@/lib/safe-list/types';
import { buildPublicTokenPagePath } from '@/lib/token/public-url';
import { riskBadgeClass } from '@/lib/watchlist/risk-styles';
import { cn } from '@/lib/utils';

type PaginatedResponse = {
  tokens: CuratedTokenDto[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function SafeListPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [data, setData] = React.useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/guardian/safe-list?page=${page}&limit=10`, { cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as PaginatedResponse & { error?: string } | null;
        if (!res.ok) {
          if (!cancelled) setError(json?.error ?? 'Failed to load safe list');
          return;
        }
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError('Network error. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(next));
    router.push(`/safe-list?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 -ml-2 rounded-xl px-2 text-sm text-muted-foreground hover:text-foreground')}
      >
        <ArrowLeft className="mr-1 size-4" />
        Dashboard
      </Link>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && (data?.tokens.length ?? 0) === 0 ? (
        <Card className="rounded-2xl border border-dashed">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No curated tokens yet. Run the safe-list refresh cron or check back later.
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && data?.tokens.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.tokens.map((token) => (
              <Card key={token.id} className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
                <CardContent className="space-y-4 ">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold tracking-tight">{token.ticker ?? 'Token'}</p>
                      <p className="text-xs text-muted-foreground">{token.chain}</p>
                    </div>
                    <Badge className={cn('rounded-full border-0', riskBadgeClass(token.riskLevel))}>
                      {token.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{token.reasonShort}</p>
                  <p className="text-sm font-medium tabular-nums">Score {token.riskScore}/100</p>
                  <Link
                    href={buildPublicTokenPagePath(token.tokenAddress, token.chain)}
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-10 w-full rounded-xl')}
                  >
                    Check full report
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
