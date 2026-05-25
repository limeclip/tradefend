'use client';

import * as React from 'react';
import Link from 'next/link';
import { GitCompareArrows, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { WatchlistScoreRing } from '@/components/watchlist/WatchlistScoreRing';
import { riskBadgeClass, riskStripeClass } from '@/lib/watchlist/risk-styles';
import { buildCompareUrl } from '@/lib/compare/urls';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export type WatchlistRow = {
  id: string;
  tokenAddress: string;
  ticker: string | null;
  chain: string | null;
  addedAt: string;
  lastCheckedAt: string | null;
  lastRiskScore: number | null;
  lastRiskLevel: string | null;
  notifyOnChange: boolean;
};

type Props = {
  items: WatchlistRow[];
  tokensUsed: number;
  tokensRemaining: number;
  maxTokens: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

function toErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== 'object') return fallback;
  const e = json as { error?: unknown };
  return typeof e.error === 'string' && e.error.trim() ? e.error : fallback;
}

function formatAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function displayLabel(row: WatchlistRow): string {
  return row.ticker?.trim() || formatAddress(row.tokenAddress);
}

function buildWatchlistUrl(page: number): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  const s = params.toString();
  return s ? `/watchlist?${s}` : '/watchlist';
}

function visiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('ellipsis');
    out.push(p);
  }
  return out;
}

export function WatchlistList({
  items: initialItems,
  tokensRemaining,
  maxTokens,
  currentPage,
  totalPages,
  totalItems,
}: Props) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [checkingId, setCheckingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  async function handleRefreshAll() {
    if (items.length === 0) return;
    setError(null);
    setRefreshing(true);
    const toastId = toast.loading('Updating...');
    try {
      const res = await fetch('/api/watchlist/refresh-all', { method: 'POST' });
      const json = (await res.json().catch(() => null)) as
        | { tokensUpdated?: number; error?: string }
        | null;
      if (!res.ok) {
        toast.error(toErrorMessage(json, 'Could not refresh watchlist.'), { id: toastId });
        return;
      }
      const count = json?.tokensUpdated ?? 0;
      toast.success(`Updated ${count} token${count === 1 ? '' : 's'}`, { id: toastId });
      router.refresh();
    } catch {
      toast.error('Network error. Try again.', { id: toastId });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCheckNow(id: string) {
    setError(null);
    setCheckingId(id);
    const toastId = toast.loading('Running full check…');
    try {
      const res = await fetch(`/api/watchlist/${id}/refresh`, { method: 'POST' });
      const json = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            item?: {
              lastRiskScore: number | null;
              lastRiskLevel: string | null;
              lastCheckedAt: string | null;
              ticker: string | null;
              chain: string | null;
            };
          }
        | null;

      if (res.status === 403) {
        toast.error(toErrorMessage(json, 'Monthly check limit reached.'), { id: toastId });
        return;
      }
      if (!res.ok || !json?.ok) {
        toast.error(toErrorMessage(json, 'Could not check token.'), { id: toastId });
        return;
      }

      if (json.item) {
        setItems((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  lastRiskScore: json.item!.lastRiskScore,
                  lastRiskLevel: json.item!.lastRiskLevel,
                  lastCheckedAt: json.item!.lastCheckedAt,
                  ticker: json.item!.ticker ?? row.ticker,
                  chain: json.item!.chain ?? row.chain,
                }
              : row,
          ),
        );
      }

      toast.success('Token updated', { id: toastId });
      router.refresh();
    } catch {
      toast.error('Network error. Try again.', { id: toastId });
    } finally {
      setCheckingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !json?.success) {
        setError(toErrorMessage(json, 'Could not remove this token.'));
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (items.length === 1 && currentPage > 1) {
        router.push(buildWatchlistUrl(currentPage - 1));
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{totalItems}</span>
          {' / '}
          <span className="font-medium text-foreground">{maxTokens}</span> tokens used
          {tokensRemaining > 0 ? (
            <>
              {' '}
              · <span className="font-medium text-foreground">{tokensRemaining}</span> remaining
            </>
          ) : (
            <span className="text-destructive"> · limit reached</span>
          )}
        </p>
        {items.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl sm:shrink-0 cursor-pointer"
            disabled={refreshing}
            onClick={() => void handleRefreshAll()}
          >
            <RefreshCw className={cn('mr-2 size-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing…' : 'Refresh all'}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ul className="grid list-none gap-4 p-0">
        {items.length === 0 ? (
          <li className="rounded-3xl border border-border dark:border-border/50 bg-background dark:bg-[#1c1c1c] px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold tracking-tight text-foreground">Your watchlist is empty</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Add tokens from a risk report to track their risk score here.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex">
              <Button className="rounded-2xl">Go to dashboard</Button>
            </Link>
          </li>
        ) : (
          items.map((row) => {
            const hasScore = row.lastRiskScore !== null && row.lastRiskScore !== undefined;
            const stripeLevel = hasScore ? row.lastRiskLevel : null;

            return (
              <li
                key={row.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-border dark:border-border/50 bg-background dark:bg-[#1c1c1c] shadow-sm transition hover:bg-muted/40 dark:hover:bg-sidebar',
                  'transition-shadow duration-300 hover:shadow-md',
                )}
              >
                <div
                  className={cn('absolute inset-y-0 left-0 w-1', riskStripeClass(stripeLevel))}
                  aria-hidden
                />
                <div className="flex flex-col gap-5 p-2 px-3 pl-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-5">
                    {hasScore ? (
                      <WatchlistScoreRing score={row.lastRiskScore!} riskLevel={row.lastRiskLevel} />
                    ) : (
                      <div className="flex size-[88px] shrink-0 flex-col items-center justify-center rounded-full border border-dashed border-border bg-muted/30">
                        <span className="text-lg font-semibold text-muted-foreground">—</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Score
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                        {displayLabel(row)}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{row.tokenAddress}</p>
                      {row.chain ? (
                        <p className="text-sm capitalize text-muted-foreground">{row.chain}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(row.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        {row.lastCheckedAt
                          ? ` · Last checked ${new Date(row.lastCheckedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end justify-between sm:pl-4">
                    {hasScore && row.lastRiskLevel ? (
                      <Badge
                        className={cn(
                          'rounded-full px-3 py-3 text-xs font-medium',
                          riskBadgeClass(row.lastRiskLevel),
                        )}
                      >
                        {row.lastRiskLevel}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                        Pending
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl cursor-pointer"
                      disabled={checkingId === row.id || refreshing}
                      onClick={() => void handleCheckNow(row.id)}
                    >
                      <RefreshCw
                        className={cn('mr-1.5 size-4', checkingId === row.id && 'animate-spin')}
                      />
                      {checkingId === row.id ? 'Checking…' : 'Check now'}
                    </Button>
                    <Link
                      href={buildCompareUrl({
                        addresses: [row.tokenAddress],
                        chain: row.chain,
                      })}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'inline-flex rounded-xl cursor-pointer',
                      )}
                    >
                      <GitCompareArrows className="mr-1.5 size-4" />
                      Compare
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl cursor-pointer hover:text-destructive"
                      disabled={deletingId === row.id}
                      onClick={() => void handleDelete(row.id)}
                    >
                      <Trash2 className=" size-4" />
                      {deletingId === row.id ? 'Removing…' : ''}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {totalPages > 1 ? (
        <Pagination className="mx-0 w-full flex-col gap-4 sm:flex-row sm:justify-between">
          <PaginationContent className="mx-0 flex-wrap justify-center gap-1">
            <PaginationItem>
              <PaginationPrevious
                href={currentPage > 1 ? buildWatchlistUrl(currentPage - 1) : '#'}
                className={cn(currentPage <= 1 && 'pointer-events-none opacity-40')}
                aria-disabled={currentPage <= 1}
                onClick={(e) => {
                  if (currentPage <= 1) e.preventDefault();
                }}
              />
            </PaginationItem>

            {visiblePages(currentPage, totalPages).map((p, idx) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={buildWatchlistUrl(p)} isActive={p === currentPage} size="icon">
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={currentPage < totalPages ? buildWatchlistUrl(currentPage + 1) : '#'}
                className={cn(currentPage >= totalPages && 'pointer-events-none opacity-40')}
                aria-disabled={currentPage >= totalPages}
                onClick={(e) => {
                  if (currentPage >= totalPages) e.preventDefault();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}