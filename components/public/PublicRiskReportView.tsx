import {
  ShieldCheck,
  ShieldX,
  Sparkles,
  TriangleAlert,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { quickDecisionFromReport } from '@/lib/services/risk/quick-decision';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { cn } from '@/lib/utils';

type Props = {
  report: TokenRiskReport;
  className?: string;
};

const R = 52;
const CIRC = 2 * Math.PI * R;

function riskTone(level: TokenRiskReport['riskLevel']) {
  if (level === 'LOW') {
    return {
      ring: 'ring-emerald-500/20 dark:ring-emerald-400/25',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      label: 'Low risk',
      icon: ShieldCheck,
      stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
      track: 'stroke-emerald-500/15 dark:stroke-emerald-400/20',
    };
  }
  if (level === 'MEDIUM') {
    return {
      ring: 'ring-amber-500/20 dark:ring-amber-400/25',
      text: 'text-amber-800 dark:text-amber-200',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      label: 'Medium risk',
      icon: TriangleAlert,
      stroke: 'stroke-amber-500 dark:stroke-amber-400',
      track: 'stroke-amber-500/15 dark:stroke-amber-400/20',
    };
  }
  return {
    ring: 'ring-red-500/20 dark:ring-red-400/25',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    label: 'High risk',
    icon: ShieldX,
    stroke: 'stroke-red-500 dark:stroke-red-400',
    track: 'stroke-red-500/15 dark:stroke-red-400/20',
  };
}

function RiskRingStatic({
  value,
  strokeClass,
  trackClass,
}: {
  value: number;
  strokeClass: string;
  trackClass: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const offset = CIRC * (1 - v / 100);
  return (
    <svg className="size-28 shrink-0 -rotate-90 md:size-32" viewBox="0 0 120 120" aria-hidden>
      <circle className={cn('fill-none', trackClass)} cx="60" cy="60" r={R} strokeWidth="10" />
      <circle
        className={cn('fill-none', strokeClass)}
        cx="60"
        cy="60"
        r={R}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium text-foreground">{Math.round(v)}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/80 dark:bg-foreground/70"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

function quickDecisionTone(level: ReturnType<typeof quickDecisionFromReport>['level']): string {
  if (level === 'LOW') return 'text-emerald-700 dark:text-emerald-300';
  if (level === 'MEDIUM') return 'text-amber-800 dark:text-amber-200';
  if (level === 'CRITICAL') return 'text-red-800 dark:text-red-200';
  return 'text-red-700 dark:text-red-300';
}

export function PublicRiskReportView({ report, className }: Props) {
  const tone = riskTone(report.riskLevel);
  const Icon = tone.icon;
  const quickDecision = quickDecisionFromReport(report);
  const title = report.ticker ?? report.query;
  const subtitleParts = [report.name, report.chain, report.tokenAddress].filter(Boolean);
  const overall = report.scores.overall;

  return (
    <Card
      className={cn(
        'rounded-2xl ring-foreground/10 dark:ring-border/50 bg-card dark:bg-[#1c1c1c] py-0 text-card-foreground shadow-sm',
        className,
      )}
    >
      <CardHeader className="gap-4 px-6 pb-2 pt-8 md:px-10 md:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</CardTitle>
            {subtitleParts.length > 0 ? (
              <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                {subtitleParts.join(' · ')}
              </p>
            ) : null}
          </div>
          <Badge
            className={cn('w-fit rounded-full border-0 px-4 py-2 text-sm font-medium', tone.bg, tone.text)}
            variant="secondary"
          >
            <Icon className={cn('mr-1.5 inline size-4', tone.text)} />
            {tone.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 px-6 pb-10 md:px-10 md:pb-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="rounded-2xl border border-border p-6 md:p-8">
            <div
              className={cn(
                'flex flex-col items-center gap-6 rounded-2xl p-6 ring-1 ring-inset sm:flex-row sm:items-center',
                tone.ring,
                tone.bg,
              )}
            >
              <RiskRingStatic value={overall} strokeClass={tone.stroke} trackClass={tone.track} />
              <div className="text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Overall risk score
                </p>
                <p className={cn('mt-1 text-5xl font-semibold tabular-nums tracking-tight md:text-6xl', tone.text)}>
                  {overall}
                  <span className="ml-2 text-lg font-medium text-muted-foreground">/ 100</span>
                </p>
                <p className="mt-2 text-sm font-medium">Level: {report.riskLevel}</p>
              </div>
            </div>
            <h2 className="mt-8 text-sm font-semibold text-foreground">Scores</h2>
            <div className="mt-5 space-y-5">
              <ScoreBar label="Liquidity" value={report.scores.liquidity} />
              <ScoreBar label="Concentration" value={report.scores.concentration} />
              <ScoreBar label="Volatility" value={report.scores.volatility} />
              <ScoreBar label="Contract security" value={report.scores.contractSecurity} />
            </div>
          </section>

          <section className="rounded-2xl border border-border p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">AI insight</h2>
            </div>
            <div className="mt-5 space-y-4 rounded-2xl bg-muted/80 p-5 dark:bg-muted/40">
              <p className="text-sm leading-relaxed text-foreground/90">{report.aiInsight.summary}</p>
              {Array.isArray(report.aiInsight.reasons) && report.aiInsight.reasons.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-foreground/90">
                  {report.aiInsight.reasons.map((reason) => (
                    <li key={reason} className="flex gap-3">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/70" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="rounded-xl border border-border/60 bg-background p-4 dark:bg-[#1c1c1c]">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recommendation
                </p>
                <p className="mt-1.5 text-sm font-medium">{report.aiInsight.recommendationText}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-4 dark:bg-[#1c1c1c]">
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5 text-muted-foreground" aria-hidden />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Quick AI decision
                  </p>
                  <Badge variant="secondary" className="ml-auto rounded-full px-2 py-0 text-[10px]">
                    {quickDecision.level}
                  </Badge>
                </div>
                <p className={cn('mt-2 text-sm font-medium leading-relaxed', quickDecisionTone(quickDecision.level))}>
                  {quickDecision.text}
                </p>
              </div>
            </div>
          </section>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyzed at {new Date(report.analyzedAt).toLocaleString()}
        </p>
        <p className="border-t border-border pt-4 text-center text-[11px] leading-relaxed text-muted-foreground md:text-left">
          Risk assessment is based on available data and does not guarantee safety. This is not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
