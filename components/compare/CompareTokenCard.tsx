'use client';

import * as React from 'react';
import { Copy, GitCompareArrows } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CompareTokenResult } from '@/lib/compare/types';
import { riskBadgeClass, riskStripeClass } from '@/lib/watchlist/risk-styles';
import { cn } from '@/lib/utils';

type Props = {
  result: CompareTokenResult | null;
  loading?: boolean;
};

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

function shortVerdict(recommendation: string, riskLevel: string): string {
  if (recommendation === 'SAFE') return `Low risk · ${riskLevel}`;
  if (recommendation === 'CAUTION') return `Caution · ${riskLevel}`;
  return `High caution · ${riskLevel}`;
}

export function CompareTokenCard({ result, loading }: Props) {
  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch {
      toast.error('Could not copy address');
    }
  }

  if (loading) {
    return (
      <Card className="min-w-[240px] rounded-2xl border-border shadow-sm">
        <CardHeader className="space-y-3 pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const label = result.ticker ?? result.address.slice(0, 10);

  if (!result.success || !result.data) {
    return (
      <Card className="min-w-[240px] rounded-2xl border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <GitCompareArrows className="size-4 text-muted-foreground" />
            {label}
          </CardTitle>
          <button
            type="button"
            className="truncate text-left font-mono text-xs text-muted-foreground hover:text-foreground"
            onClick={() => void copyAddress(result.address)}
          >
            {result.address}
          </button>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{result.error ?? 'Unknown error'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { data } = result;
  const level = data.riskLevel;

  return (
    <Card className="relative min-w-[240px] overflow-hidden rounded-2xl border-border dark:bg-[#1c1c1c] shadow-sm">
      <div className={cn('absolute inset-y-0 left-0 w-1', riskStripeClass(level))} aria-hidden />
      <CardHeader className="space-y-2 pb-2 pl-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">{data.ticker ?? label}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg cursor-pointer"
            aria-label="Copy address"
            onClick={() => void copyAddress(result.address)}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
        <button
          type="button"
          className="truncate text-left font-mono text-xs text-muted-foreground hover:text-foreground"
          onClick={() => void copyAddress(result.address)}
        >
          {result.address}
        </button>
        <Badge className={cn('w-fit rounded-full px-2.5 py-0.5 text-xs font-medium', riskBadgeClass(level))}>
          {level}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pl-5 text-sm">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overall score</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{data.scores.overall}</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
        <MetricRow label="Liquidity" value={data.scores.liquidity} />
        <MetricRow label="Concentration" value={data.scores.concentration} />
        <MetricRow label="Volatility" value={data.scores.volatility} />
        <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Price {formatUsd(data.data.priceUSD)}</span>
          <span>Vol 24h {formatUsd(data.data.volume24h)}</span>
        </div>
        <p className="rounded-xl border border-border bg-background dark:bg-sidebar-accent p-3 text-xs leading-relaxed text-foreground">
          {shortVerdict(data.aiInsight.recommendation, level)}
        </p>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium text-foreground">{Math.round(v)}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/80 transition-all" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
