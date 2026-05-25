'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowUpRight } from 'lucide-react';

import type { StoredCheckRow } from '@/lib/history/build-report-from-check';
import { buildReportFromCheck } from '@/lib/history/build-report-from-check';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RiskReportCard } from '@/components/risk/RiskReportCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

function riskStripeClass(level: string | null): string {
  if (level === 'LOW') return 'bg-emerald-500 dark:bg-emerald-400';
  if (level === 'MEDIUM') return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-red-500 dark:bg-red-400';
}

function riskBadgeClass(level: string | null): string {
  if (level === 'LOW')
    return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (level === 'MEDIUM')
    return 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
  return 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300';
}

function buildHistoryUrl(page: number, q: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (q.trim()) params.set('q', q.trim());
  const s = params.toString();
  return s ? `/history?${s}` : '/history';
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

type Props = {
  checks: StoredCheckRow[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  isPro?: boolean;
};

export function HistoryList({ checks: initialChecks, total, page, pageSize, q, isPro = false }: Props) {
  const router = useRouter();
  const [checks, setChecks] = React.useState(initialChecks);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<TokenRiskReport | null>(null);

  React.useEffect(() => {
    setChecks(initialChecks);
  }, [initialChecks]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !json?.success) {
        setError(json?.error ?? 'Could not delete this check.');
        return;
      }
      const next = checks.filter((c) => c.id !== id);
      setChecks(next);
      if (next.length === 0 && page > 1) {
        router.push(buildHistoryUrl(page - 1, q));
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function openView(row: StoredCheckRow) {
    const built = buildReportFromCheck(row);
    if (!built) {
      setError('Saved report is missing or has an unexpected format.');
      return;
    }
    setSelectedReport(built);
    setModalOpen(true);
  }

  return (
    <div className="space-y-8">
      <form
        method="get"
        action="/history"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        role="search"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="history-q" className="text-sm font-medium text-foreground">
            Filter by ticker or query
          </Label>
          <Input
            id="history-q"
            name="q"
            defaultValue={q}
            placeholder="e.g. SOL, ETH, 0x…"
            className="h-11 rounded-xl border-border bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="h-11 rounded-xl px-5">
            Search
          </Button>
          {q ? (
            <Link
              href="/history"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-11 rounded-xl px-5')}
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ul className="grid list-none gap-4  grid-cols-1 md:grid-cols-2 ">
        {checks.length === 0 ? (
          <li className="rounded-2xl border border-border dark:border-border/50 shadow-sm bg-background dark:bg-[#1c1c1c] p-10 text-center text-muted-foreground col-span-2">
            No saved checks match your filters.
          </li>
        ) : (
          checks.map((row) => {
            const label = row.ticker || row.query || row.tokenAddress || 'Unknown';
            return (
              <li
                key={row.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-border bg-card dark:bg-[#1c1c1c] shadow-sm transition hover:bg-muted/40 dark:hover:bg-sidebar  cursor-pointer',
                  'transition-shadow duration-300 hover:shadow-md',
                )}
              >
                <div
                  className={cn('absolute inset-y-0 left-0 w-1', riskStripeClass(row.overallRisk))}
                  aria-hidden
                />
                <div className="flex flex-col gap-4 p-3 pl-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-base font-semibold tracking-tight text-foreground">{label}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[row.chain, row.tokenAddress ? `${row.tokenAddress.slice(0, 10)}…` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end justify-between">
                    <Badge className={cn('rounded-full px-3 py-3 text-xs font-medium', riskBadgeClass(row.overallRisk))}>
                      {row.overallRisk}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl cursor-pointer"
                      onClick={() => openView(row)}
                    >
                     
                      View
                      <ArrowUpRight />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl cursor-pointer hover:text-destructive"
                      disabled={deletingId === row.id}
                      onClick={() => void handleDelete(row.id)}
                    >
                      <Trash2 className="size-4" />
                      {deletingId === row.id ? 'Deleting…' : ''}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
  
        {totalPages > 1 && (
          <Pagination >
            <PaginationContent className="mx-0 flex-wrap justify-center gap-1">
              <PaginationItem>
                <PaginationPrevious
                  href={safePage > 1 ? buildHistoryUrl(safePage - 1, q) : '#'}
                  className={cn(safePage <= 1 && 'pointer-events-none opacity-40')}
                  aria-disabled={safePage <= 1}
                  onClick={(e) => {
                    if (safePage <= 1) e.preventDefault();
                  }}
                />
              </PaginationItem>

              {visiblePages(safePage, totalPages).map((p, idx) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href={buildHistoryUrl(p, q)} isActive={p === safePage} size="icon">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href={safePage < totalPages ? buildHistoryUrl(safePage + 1, q) : '#'}
                  className={cn(safePage >= totalPages && 'pointer-events-none opacity-40')}
                  aria-disabled={safePage >= totalPages}
                  onClick={(e) => {
                    if (safePage >= totalPages) e.preventDefault();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
    
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
        }}
        title="Saved analysis"
        className="max-w-6xl"
      >
        {selectedReport ? (
          <RiskReportCard
            report={selectedReport}
            isPro={isPro}
            onNewCheck={() => {
              setModalOpen(false);
              setSelectedReport(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
