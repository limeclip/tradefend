'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
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

export function ProvenSafeListPanel() {
  const [data, setData] = React.useState<SafeListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/guardian/safe-list', { cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as SafeListResponse | { error?: string } | null;
        if (!res.ok) {
          if (!cancelled) {
            setError(
              typeof json === 'object' && json && 'error' in json
                ? String(json.error)
                : 'Failed to load safe list',
            );
          }
          return;
        }
        if (!cancelled) setData(json as SafeListResponse);
      } catch {
        if (!cancelled) setError('Network error. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const tokens = data?.tokens ?? [];

  if (tokens.length === 0) {
    return (
      <Card className="rounded-2xl border border-dashed border-border">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <ShieldCheck className="size-10 text-muted-foreground" strokeWidth={1.25} />
          <p className="text-sm text-muted-foreground">
            {data?.message ?? 'No curated tokens yet. The safe list refreshes daily.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data?.limited ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {data.message ?? 'More tokens available on Pro plan.'}
          </p>
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setUpgradeOpen(true)}>
            Upgrade to Pro
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => (
          <Card key={token.id} className="rounded-2xl border border-border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tracking-tight">{token.ticker ?? 'Token'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{token.chain}</p>
                </div>
                <Badge className={cn('rounded-full border-0', riskBadgeClass(token.riskLevel))}>
                  {token.riskLevel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{token.reasonShort}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk score</span>
                <span className="font-semibold tabular-nums">{token.riskScore}/100</span>
              </div>
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

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Proven Safe List is larger on Pro"
        description="Upgrade to Pro to unlock the full curated list of lower-risk tokens."
      />
    </div>
  );
}
