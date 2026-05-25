'use client';

import * as React from 'react';
import { CalendarDays, Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { WeeklyInsightStats } from '@/lib/guardian/weekly-insight';
import { cn } from '@/lib/utils';

type WeeklyInsightResponse = {
  insight: {
    id: string;
    createdAt: string;
    periodStart: string;
    periodEnd: string;
    stats: WeeklyInsightStats;
    summary: string;
    recommendations: string[];
  } | null;
  isPro: boolean;
  weeklyInsightCount: number;
  lastWeeklyInsightAt: string | null;
  nextAvailableAt: string | null;
  canGenerate: boolean;
  generated?: boolean;
  error?: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function WeeklyInsightPanel() {
  const [data, setData] = React.useState<WeeklyInsightResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guardian/weekly-insight', { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as WeeklyInsightResponse | null;
      if (res.ok && json) {
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerate() {
    if (!data?.canGenerate && !data?.isPro) {
      toast.message('Wait until next week', {
        description: data?.nextAvailableAt
          ? `Next insight available ${formatDate(data.nextAvailableAt)}`
          : undefined,
      });
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/guardian/weekly-insight?generate=true', { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as WeeklyInsightResponse | null;

      if (res.status === 403 && json?.error) {
        toast.message(json.error, {
          description: json.nextAvailableAt
            ? `Available ${formatDate(json.nextAvailableAt)}`
            : undefined,
        });
        if (json.insight) {
          setData({
            insight: json.insight,
            isPro: json.isPro ?? false,
            weeklyInsightCount: data?.weeklyInsightCount ?? 0,
            lastWeeklyInsightAt: json.lastWeeklyInsightAt ?? data?.lastWeeklyInsightAt ?? null,
            nextAvailableAt: json.nextAvailableAt ?? null,
            canGenerate: false,
          });
        }
        return;
      }

      if (!res.ok || !json) {
        toast.error('Could not generate insight');
        return;
      }

      setData(json);
      toast.success(json.generated ? 'Weekly insight generated' : 'Insight loaded');
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const insight = data?.insight;
  const stats = insight?.stats;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 bg-background shadow-sm dark:bg-[#1c1c1c]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Weekly Personal Insight</CardTitle>
              {data?.isPro ? (
                <Badge variant="secondary" className="rounded-full">
                  Pro
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  Free · 1 / week
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              AI summary of your checks and comparisons from the last 7 days, with guidance for next week.
            </p>
          </div>

          <Button
            type="button"
            className="h-10 shrink-0 rounded-xl cursor-pointer"
            disabled={generating || (!data?.canGenerate && !data?.isPro)}
            onClick={() => void handleGenerate()}
          >
            <RefreshCw className={cn('mr-2 size-4', generating && 'animate-spin')} />
            {generating ? 'Generating…' : 'Generate New Insight'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {!insight ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <Lightbulb className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No insight yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Run a few token checks, then generate your first weekly summary.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  Generated {formatDate(insight.createdAt)}
                </span>
                <span>
                  Period {formatDate(insight.periodStart)} – {formatDate(insight.periodEnd)}
                </span>
                {data?.weeklyInsightCount ? (
                  <span className="tabular-nums">Total insights: {data.weeklyInsightCount}</span>
                ) : null}
              </div>

              {stats ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatTile label="Checks" value={stats.totalChecks} />
                  <StatTile label="Comparisons" value={stats.totalCompares} />
                  <StatTile
                    label="Avg. risk score"
                    value={stats.averageRiskScore !== null ? `${stats.averageRiskScore}/100` : '—'}
                  />
                  <StatTile
                    label="Risk mix"
                    value={`${stats.riskDistribution.LOW}L · ${stats.riskDistribution.MEDIUM}M · ${stats.riskDistribution.HIGH}H`}
                  />
                </div>
              ) : null}

              <div className="rounded-2xl bg-muted/50 p-5 dark:bg-muted/40">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{insight.summary}</p>
              </div>

              {insight.recommendations.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Recommendations for next week</p>
                  <ul className="space-y-2.5">
                    {insight.recommendations.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm dark:bg-[#1c1c1c]"
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                          {idx + 1}
                        </span>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stats && stats.topTokens.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Most checked tokens</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.topTokens.map((token) => (
                      <Badge key={token.address} variant="secondary" className="rounded-full px-3 py-1 font-mono text-xs">
                        {shortAddress(token.address)} · {token.count}×
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {data?.nextAvailableAt && !data.canGenerate && !data.isPro ? (
            <p className="text-xs text-muted-foreground">
              Next free insight available on {formatDate(data.nextAvailableAt)}.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
