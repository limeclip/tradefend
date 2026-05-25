'use client';

import * as React from 'react';
import {
  ArrowRight,
  Eye,
  GitCompareArrows,
  Share2,
  Shield,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Star,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import type { TokenRiskReport } from '@/lib/services/risk/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { cn } from '@/lib/utils';
import { buildCompareUrl } from '@/lib/compare/urls';
import { buildBuildPositionUrl } from '@/lib/guardian/urls';
import { buildWatchlistPayload, resolveWatchlistTokenAddress } from '@/lib/watchlist/from-report';
import { ShareButtons } from '@/components/public/ShareButtons';
import { quickDecisionFromReport } from '@/lib/services/risk/quick-decision';
import { buildPublicTokenPagePath } from '@/lib/token/public-url';
import { toast } from 'sonner';

type Props = {
  report: TokenRiskReport;
  onNewCheck?: () => void;
  className?: string;
  isPro?: boolean;
};

function riskTone(
  level: TokenRiskReport['riskLevel'],
): {
  ring: string;
  text: string;
  bg: string;
  label: string;
  icon: React.ElementType;
  stroke: string;
  track: string;
} {
  if (level === 'LOW')
    return {
      ring: 'ring-emerald-500/20 dark:ring-emerald-400/25',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      label: 'Low risk',
      icon: ShieldCheck,
      stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
      track: 'stroke-emerald-500/15 dark:stroke-emerald-400/20',
    };
  if (level === 'MEDIUM')
    return {
      ring: 'ring-amber-500/20 dark:ring-amber-400/25',
      text: 'text-amber-800 dark:text-amber-200',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      label: 'Medium risk',
      icon: TriangleAlert,
      stroke: 'stroke-amber-500 dark:stroke-amber-400',
      track: 'stroke-amber-500/15 dark:stroke-amber-400/20',
    };
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

const R = 52;
const CIRC = 2 * Math.PI * R;

function RiskRing({ value, strokeClass, trackClass }: { value: number; strokeClass: string; trackClass: string }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const target = CIRC * (1 - v / 100);
  const [dashOffset, setDashOffset] = React.useState(CIRC);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setDashOffset(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <svg className="size-28 shrink-0 -rotate-90 md:size-28" viewBox="0 0 120 120" aria-hidden>
      <circle className={cn('fill-none', trackClass)} cx="60" cy="60" r={R} strokeWidth="10" />
      <circle
        className={cn('fill-none transition-[stroke-dashoffset] duration-1000 ease-out', strokeClass)}
        cx="60"
        cy="60"
        r={R}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const t = requestAnimationFrame(() => setWidth(v));
    return () => cancelAnimationFrame(t);
  }, [v]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium text-foreground">{Math.round(v)}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full max-w-full rounded-full bg-foreground/80 transition-[width] duration-700 ease-out dark:bg-foreground/70"
          style={{ width: `${width}%` }}
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

export function RiskReportCard({ report, onNewCheck, className, isPro: isProProp }: Props) {
  const tone = riskTone(report.riskLevel);
  const quickDecision = React.useMemo(() => quickDecisionFromReport(report), [report]);
  const Icon = tone.icon;
  const title = report.ticker ? `${report.ticker}` : report.query;
  const subtitleParts = [report.name, report.chain, report.tokenAddress].filter(Boolean);
  const overall = report.scores.overall;
  const query = report.query?.trim?.() ? report.query.trim() : String(report.query ?? '').trim();

  const [favoriteId, setFavoriteId] = React.useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);
  const [watchlistItemId, setWatchlistItemId] = React.useState<string | null>(null);
  const [watchlistLoading, setWatchlistLoading] = React.useState(false);
  const watchlistKey = React.useMemo(() => resolveWatchlistTokenAddress(report), [report]);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isProState, setIsProState] = React.useState<boolean>(Boolean(isProProp));
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const compareHref = React.useMemo(() => {
    const address = resolveWatchlistTokenAddress(report);
    if (!address) return null;
    return buildCompareUrl({ addresses: [address], chain: report.chain });
  }, [report]);
  const buildPositionHref = React.useMemo(() => {
    if (!isAuthenticated) return null;
    const address = resolveWatchlistTokenAddress(report);
    const price = report.data?.priceUSD;
    if (!address || !price || !Number.isFinite(price) || price <= 0) return null;
    return buildBuildPositionUrl({
      address,
      chain: report.chain,
      ticker: report.ticker,
      price,
    });
  }, [report, isAuthenticated]);
  const [favoritesUpgradeOpen, setFavoritesUpgradeOpen] = React.useState(false);
  const sharePath = React.useMemo(() => {
    const address = resolveWatchlistTokenAddress(report);
    if (!address) return null;
    return buildPublicTokenPagePath(address, report.chain);
  }, [report]);

  React.useEffect(() => {
    if (!sharePath) {
      setShareUrl(null);
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setShareUrl(origin ? `${origin}${sharePath}` : sharePath);
  }, [sharePath]);

  React.useEffect(() => {
    if (typeof isProProp === 'boolean') {
      setIsProState(isProProp);
      setIsAuthenticated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/subscription/status', { method: 'GET' });
        const json = (await res.json().catch(() => null)) as
          | { plan?: string; subscriptionStatus?: string }
          | null;
        if (!cancelled) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            setIsProState(false);
            return;
          }
          setIsAuthenticated(true);
          const plan = json?.plan ?? 'free';
          const isPro = json?.subscriptionStatus === 'active' && (plan === 'pro_monthly' || plan === 'pro_yearly');
          setIsProState(isPro);
        }
      } catch {
        if (!cancelled) setIsProState(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isProProp]);

  React.useEffect(() => {
    if (!query || !isProState) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/favorites', { method: 'GET' });
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as
          | { favorites?: Array<{ id: string; tokenQuery: string }> }
          | null;
        const match = json?.favorites?.find((f) => f.tokenQuery === query);
        if (!cancelled) setFavoriteId(match?.id ?? null);
      } catch {
        // non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, isProState]);

  React.useEffect(() => {
    if (!watchlistKey) {
      setWatchlistItemId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/watchlist', { method: 'GET' });
        if (res.status === 401) return;
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as
          | { items?: Array<{ id: string; tokenAddress: string }> }
          | null;
        const match = json?.items?.find((item) => item.tokenAddress === watchlistKey);
        if (!cancelled) setWatchlistItemId(match?.id ?? null);
      } catch {
        // non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [watchlistKey]);

  React.useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  async function toggleFavorite() {
    if (!isProState) {
      setFavoritesUpgradeOpen(true);
      return;
    }
    if (!query) return;
    setNotice(null);
    setFavoriteLoading(true);
    try {
      if (favoriteId) {
        const res = await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
        const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
        if (res.ok && json?.success) {
          setFavoriteId(null);
          toast.success('Removed from favorites');
        } else {
          toast.error('Could not remove favorite');
        }
        return;
      }

      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = (await res.json().catch(() => null)) as { favorite?: { id: string } } | null;
      if (res.ok && json?.favorite?.id) {
        setFavoriteId(json.favorite.id);
        toast.success('Saved to favorites');
      } else {
        toast.error('Could not save to favorites');
      }
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function addToWatchlist() {
    const payload = buildWatchlistPayload(report);
    if (!payload) {
      toast.error('Cannot add this token to the watchlist.');
      return;
    }
    if (watchlistItemId) return;

    setWatchlistLoading(true);
    try {
      const res = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { item?: { id: string }; error?: string }
        | null;

      if (res.status === 401) {
        toast.error('Sign in to add tokens to your watchlist.');
        return;
      }
      if (res.status === 409) {
        toast.message('Already on your watchlist');
        const listRes = await fetch('/api/watchlist', { method: 'GET' });
        if (listRes.ok) {
          const listJson = (await listRes.json().catch(() => null)) as
            | { items?: Array<{ id: string; tokenAddress: string }> }
            | null;
          const existing = listJson?.items?.find((item) => item.tokenAddress === watchlistKey);
          if (existing?.id) setWatchlistItemId(existing.id);
        }
        return;
      }
      if (res.ok && json?.item?.id) {
        setWatchlistItemId(json.item.id);
        toast.success('Added to watchlist');
        return;
      }
      toast.error(typeof json?.error === 'string' ? json.error : 'Could not add to watchlist');
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setWatchlistLoading(false);
    }
  }

  return (
    <Card
      className={cn(
        'rounded-2xl bg-background dark:bg-[#1c1c1c] py-0 text-card-foreground shadow-sm ring-0',
        'md:shadow-sm',
        'print:shadow-none print:border-0 print:bg-white',
        className,
      )}
    >
      <CardHeader className="gap-6 px-6 pb-2 pt-8 md:px-10 md:pt-6 print:px-0 print:pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-start gap-3">
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</CardTitle>
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    'h-10 w-10 rounded-xl p-0 cursor-pointer',
                    favoriteId ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                    'print:hidden',
                  )}
                  aria-label={
                    !isProState
                      ? 'Favorites are available on Pro plan'
                      : favoriteId
                        ? 'Remove from favorites'
                        : 'Save to favorites'
                  }
                  disabled={favoriteLoading}
                  onClick={() => void toggleFavorite()}
                  title={
                    !isProState
                      ? 'Only Pro users can add favorites'
                      : favoriteId
                        ? 'Remove from favorites'
                        : 'Save to favorites'
                  }
                >
                  <Star className={cn('size-5', favoriteId ? 'fill-current' : '')} />
                </Button>
              ) : null}
            </div>
            {subtitleParts.length ? (
              <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{subtitleParts.join(' · ')}</p>
            ) : null}
          </div>
          <div className='flex flex-col gap-3 items-end'>
            <div>
              <Badge
                className={cn('w-fit rounded-full border-0 px-3.5 py-1.5 text-xs font-medium', tone.bg, tone.text)}
                variant="secondary"
              >
                <span className="mr-1.5 inline-flex items-center">
                  <Icon className={cn('size-3.5', tone.text)} />
                </span>
                {tone.label}
              </Badge></div>
            <div className="flex flex-wrap items-center gap-2">

              {sharePath ? (
                <Link
                  href={sharePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl px-4')}
                >
                  <Share2 className="mr-2 size-4" />
                  Share report
                </Link>
              ) : null}
              {buildPositionHref ? (
                <Link
                  href={buildPositionHref}
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'h-10 rounded-xl border border-foreground bg-foreground px-4 text-background shadow-sm hover:bg-foreground/90 dark:border-foreground dark:bg-foreground dark:text-background',
                  )}
                >
                  <Shield className="mr-2 size-4" strokeWidth={1.5} />
                  Build Position
                </Link>
              ) : null}
            </div>
          </div>
        </div>



      </CardHeader>

      <CardContent className="space-y-8 px-6 pb-10 pt-4 md:px-10 md:pb-12 print:px-0 print:pb-0">

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-border bg-transparent p-6 shadow-sm md:p-6">
            <div>
              <div
                className={cn(
                  'flex flex-col items-stretch gap-6 rounded-2xl p-6 ring-1 ring-inset md:flex-row md:items-center md:justify-between md:p-6',
                  tone.ring,
                  tone.bg,
                  'print:ring-0 print:bg-white print:p-0',
                )}
              >
                <div className="flex flex-col items-center gap-6 min-[400px]:flex-row min-[400px]:items-center md:gap-10">
                  <RiskRing value={overall} strokeClass={tone.stroke} trackClass={tone.track} />
                  <div className="text-center min-[400px]:text-left">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overall Risk Score</p>
                    <p className={cn('mt-1 text-5xl font-semibold tracking-tight tabular-nums min-[400px]:text-6xl', tone.text)}>
                      {overall}
                      <span className="ml-2 text-lg font-medium text-muted-foreground md:text-xl">/ 100</span>
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">Level: {report.riskLevel}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground pt-4">Scores</p>

            <div className="mt-6 space-y-5">
              <ScoreBar label="Liquidity" value={report.scores.liquidity} />
              <ScoreBar label="Concentration" value={report.scores.concentration} />
              <ScoreBar label="Volatility" value={report.scores.volatility} />
              <ScoreBar label="Contract security" value={report.scores.contractSecurity} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-transparent p-6 shadow-sm md:p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-sm font-semibold text-foreground">AI insight</p>
            </div>
            <div className="mt-5 space-y-4 rounded-2xl bg-muted/80 p-5 dark:bg-muted/50">
              <p className="text-sm leading-relaxed text-foreground/90">{report.aiInsight.summary}</p>

              {Array.isArray(report.aiInsight.reasons) && report.aiInsight.reasons.length ? (
                <ul className="space-y-2.5 text-sm text-foreground/90">
                  {report.aiInsight.reasons.map((r, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/70" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="rounded-xl border border-border/60 bg-background dark:bg-[#1c1c1c] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommendation</p>
                <p className="mt-1.5 text-sm font-medium text-foreground">{report.aiInsight.recommendationText}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background p-4 dark:bg-[#1c1c1c]">
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5 text-muted-foreground" aria-hidden />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick AI Decision</p>
                  <Badge variant="secondary" className="ml-auto rounded-full px-2 py-0 text-[10px] font-medium">
                    {quickDecision.level}
                  </Badge>
                </div>
                <p className={cn('mt-2 text-sm font-medium leading-relaxed', quickDecisionTone(quickDecision.level))}>
                  {quickDecision.text}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-border pt-4 md:flex-row md:flex-wrap md:items-center md:justify-between print:hidden">
          <p className="text-sm text-muted-foreground">Analyzed at {new Date(report.analyzedAt).toLocaleString()}</p>
          <div className="flex flex-wrap items-center gap-2">
            {compareHref ? (
              <Link
                href={compareHref}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl px-5')}
              >
                <GitCompareArrows className="mr-2 size-4" />
                Compare this
              </Link>
            ) : null}
            {watchlistKey ? (
              watchlistItemId ? (
                <Link
                  href="/watchlist"
                  className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl px-5')}
                >
                  On watchlist
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl px-5 cursor-pointer"
                  disabled={watchlistLoading}
                  onClick={() => void addToWatchlist()}
                >
                  <Eye className="mr-2 size-4" />
                  {watchlistLoading ? 'Adding…' : 'Add to Watchlist'}
                </Button>
              )
            ) : null}
            {onNewCheck ? (
              <Button onClick={onNewCheck} variant="outline" className="h-10 rounded-xl px-5 cursor-pointer">
                Check another token <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        {shareUrl ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-4 print:hidden">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shareable risk page
            </p>
            <ShareButtons shareUrl={shareUrl} ticker={title} riskLevel={report.riskLevel} />
          </div>
        ) : null}

        {notice ? <p className="text-sm text-muted-foreground print:hidden">{notice}</p> : null}

        <UpgradeModal
          isOpen={favoritesUpgradeOpen}
          onClose={() => setFavoritesUpgradeOpen(false)}
          title="Favorites are Pro-only"
          description="Favorites are available only on Pro plan. Upgrade to Pro to save tokens."
        />

        <p
          className="border-t border-border pt-4 text-center text-[11px] leading-relaxed text-muted-foreground md:text-left"
          title="Educational tool only; not personalized investment advice."
        >
          Risk assessment is based on available data and does not guarantee safety. This is not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
