'use client';

import * as React from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CompareTokenResult } from '@/lib/compare/types';
import { riskBadgeClass } from '@/lib/watchlist/risk-styles';
import { cn } from '@/lib/utils';

type Props = {
  results: CompareTokenResult[] | null;
  loadingCount: number;
};

type MetricKey =
  | 'overall'
  | 'liquidity'
  | 'concentration'
  | 'volatility'
  | 'price'
  | 'volume'
  | 'ai';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'overall', label: 'Overall risk' },
  { key: 'liquidity', label: 'Liquidity score' },
  { key: 'concentration', label: 'Holder concentration' },
  { key: 'volatility', label: 'Volatility score' },
  { key: 'price', label: 'Price' },
  { key: 'volume', label: 'Volume 24h' },
  { key: 'ai', label: 'AI verdict' },
];

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

function shortVerdict(recommendation: string, riskLevel: string): string {
  if (recommendation === 'SAFE') return `Low risk, entry ok · ${riskLevel}`;
  if (recommendation === 'CAUTION') return `Proceed with caution · ${riskLevel}`;
  return `Avoid or reduce exposure · ${riskLevel}`;
}

async function copyAddress(address: string) {
  try {
    await navigator.clipboard.writeText(address);
    toast.success('Address copied');
  } catch {
    toast.error('Could not copy address');
  }
}

function cellValue(result: CompareTokenResult, key: MetricKey): React.ReactNode {
  if (!result.success || !result.data) {
    if (key === 'overall') {
      return (
        <Alert className="border-destructive/30 bg-destructive/5 py-2">
          <AlertTitle className="text-xs">Failed</AlertTitle>
          <AlertDescription className="text-xs">{result.error ?? 'Error'}</AlertDescription>
        </Alert>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  }

  const { data } = result;
  switch (key) {
    case 'overall':
      return (
        <div className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{data.scores.overall}</p>
          <Badge className={cn('rounded-full px-2 py-0.5 text-xs font-medium', riskBadgeClass(data.riskLevel))}>
            {data.riskLevel}
          </Badge>
        </div>
      );
    case 'liquidity':
      return <ScoreCell value={data.scores.liquidity} />;
    case 'concentration':
      return <ScoreCell value={data.scores.concentration} />;
    case 'volatility':
      return <ScoreCell value={data.scores.volatility} />;
    case 'price':
      return <span className="tabular-nums text-sm">{formatUsd(data.data.priceUSD)}</span>;
    case 'volume':
      return <span className="tabular-nums text-sm">{formatUsd(data.data.volume24h)}</span>;
    case 'ai':
      return (
        <p className="max-w-[220px] text-xs leading-relaxed text-foreground">
          {shortVerdict(data.aiInsight.recommendation, data.riskLevel)}
        </p>
      );
    default:
      return null;
  }
}

function ScoreCell({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium tabular-nums">{Math.round(v)}</span>
      <div className="h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/80" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function CompareResultsTable({ results, loadingCount }: Props) {
  const columns =
    results ??
    Array.from({ length: loadingCount }, (_, i) => ({
      address: `loading-${i}`,
      ticker: null,
      success: false,
    }));

  if (columns.length === 0) {
    return null;
  }

  const isLoading = results === null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border dark:border-border/50 bg-card dark:bg-[#1c1c1c] shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-card dark:bg-[#1c1c1c] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Metric
            </th>
            {columns.map((col) => (
              <th
                key={col.address}
                className="min-w-[180px] px-4 py-3 text-left align-bottom font-medium text-foreground"
              >
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold tracking-tight">
                      {'ticker' in col && col.ticker
                        ? col.ticker
                        : 'data' in col && col.data?.ticker
                          ? col.data.ticker
                          : col.address.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="truncate font-mono text-[10px] text-muted-foreground">{col.address}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 rounded-md cursor-pointer"
                        aria-label="Copy address"
                        onClick={() => void copyAddress(col.address)}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => (
            <tr key={metric.key} className="border-b border-border last:border-0">
              <td className="sticky left-0 z-10 bg-card dark:bg-[#1c1c1c] px-4 py-3 text-xs font-medium text-muted-foreground">
                {metric.label}
              </td>
              {columns.map((col) => (
                <td key={`${col.address}-${metric.key}`} className="px-4 py-3 align-top">
                  {isLoading ? (
                    <Skeleton className="h-8 w-full max-w-[140px] rounded-lg" />
                  ) : (
                    cellValue(col as CompareTokenResult, metric.key)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
