'use client';

import * as React from 'react';
import { ArrowRight, ArrowUpRight,  X } from 'lucide-react';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import type { StoredCheckRow } from '@/lib/history/build-report-from-check';
import { buildReportFromCheck } from '@/lib/history/build-report-from-check';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { RiskReportCard } from '@/components/risk/RiskReportCard';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

function toneForRisk(level: string | null): { badge: string; dot: string } {
  if (level === 'LOW')
    return {
      badge: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
    };
  if (level === 'MEDIUM')
    return {
      badge: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
      dot: 'bg-amber-500 dark:bg-amber-400',
    };
  return {
    badge: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    dot: 'bg-red-500 dark:bg-red-400',
  };
}

export function DashboardAnalyzer({ recentChecks = [], isPro = false }: { recentChecks?: StoredCheckRow[]; isPro?: boolean }) {
  const [query, setQuery] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<TokenRiskReport | null>(null);
  const [selectedReport, setSelectedReport] = React.useState<TokenRiskReport | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<StoredCheckRow[]>(recentChecks);
  const [hasMoreRecent, setHasMoreRecent] = React.useState(false);

  const refreshRecent = React.useCallback(async () => {
    try {
      const res = await fetch('/api/recent-checks', { method: 'GET', cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as
        | { items?: StoredCheckRow[]; hasMore?: boolean; error?: string }
        | null;

      if (!res.ok || !json?.items || !Array.isArray(json.items)) {
        return;
      }
      setRecent(json.items);
      setHasMoreRecent(Boolean(json.hasMore));
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    setRecent(recentChecks);
  }, [recentChecks]);



  async function analyze(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: trimmed, includeDetails: true }),
      });

      const json = (await res.json().catch(() => null)) as { report?: TokenRiskReport; error?: string } | null;
      if (!res.ok || !json?.report) {
        setError(json?.error ?? 'Analyze failed. Please try again.');
        return;
      }

      setReport(json.report);
      void refreshRecent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const clearReport = React.useCallback(() => {
    setReport(null);
    setError(null);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg tracking-tight">
            {/* Analyze Token */}
            Risk Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="BTC, ETH, SOL or 0x..."
            className="h-12 rounded-xl border-border"
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter') analyze(query);
            }}
          />
          <Button className="h-12 rounded-xl px-6 cursor-pointer" disabled={submitting} onClick={() => analyze(query)}>
            {submitting ? 'Analyzing...' : 'Analyze'} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {submitting && !report && !error ? (
        <Card className="rounded-2xl  ring-foreground/10 dark:ring-border/50 bg-background dark:bg-[#1c1c1c] p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </Card>
      ) : null}

      {report ? (
        <div className="relative rounded-2xl border border-border dark:border-border/40">
          <button
            onClick={clearReport}
            className="absolute right-2 top-2 z-10 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close report"
          >
            <X className="h-5 w-5" />
          </button>
          <RiskReportCard
            report={report}
            isPro={isPro}
            onNewCheck={() => {
              clearReport();
            }}
          />
        </div>
      ) : null}

      <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm  bg-background dark:bg-[#1c1c1c]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg tracking-tight">Recent checks</CardTitle>
            {hasMoreRecent ? (
              <Link href="/history" className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 shrink-0 rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground')}>
                View all
                <ArrowUpRight className="ml-1 size-4" />
                {/* <ArrowRight className="ml-1 size-4" /> */}
              </Link>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          {recent.length ? (
            recent.map((c) => {
              const t = toneForRisk(c.overallRisk ?? null);
              const label = c.ticker || c.tokenAddress || c.query || 'Unknown';
              return (
                <div
                  key={c.id}
                  className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-border bg-card dark:bg-[#1c1c1c] px-4 py-3 text-left shadow-sm transition hover:bg-muted/40 dark:hover:bg-sidebar pl-5 cursor-pointer"
                  onClick={() => {
                    const built = buildReportFromCheck(c);
                    if (!built) {
                      setError('Saved report is missing or has an unexpected format.');
                      return;
                    }
                    setSelectedReport(built);
                    setIsModalOpen(true);
                  }}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${c.overallRisk === 'LOW' ? 'bg-emerald-500 dark:bg-emerald-400' : c.overallRisk === 'MEDIUM' ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400'}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.chain, c.tokenAddress ? `${c.tokenAddress.slice(0, 8)}…` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${t.badge}`}>{c.overallRisk}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer rounded-xl "
                      onClick={() => {
                        const built = buildReportFromCheck(c);
                        if (!built) {
                          setError('Saved report is missing or has an unexpected format.');
                          return;
                        }
                        setSelectedReport(built);
                        setIsModalOpen(true);
                      }}
                    >
                      View
                      <ArrowUpRight />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No checks yet. Run your first analysis to see history here.</p>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
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
              setIsModalOpen(false);
              setSelectedReport(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
