'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { PositionPlanRecommendations } from '@/components/guardian/PositionPlanRecommendations';
import { openPositionWithToast } from '@/components/guardian/use-open-position';
import { buildOpenPositionFromBuildResult } from '@/lib/guardian/open-position';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseBuildPositionSearchParams } from '@/lib/guardian/urls';
import type { PositionBuildResult, PositionSizeType } from '@/lib/guardian/types';

export function BuildPositionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsed = React.useMemo(
    () => parseBuildPositionSearchParams(searchParams),
    [searchParams],
  );

  const [sizeType, setSizeType] = React.useState<PositionSizeType>('percent');
  const [sizeValue, setSizeValue] = React.useState('5');
  const [takeProfit, setTakeProfit] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [opening, setOpening] = React.useState(false);
  const [savedPlanId, setSavedPlanId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PositionBuildResult | null>(null);

  if (!parsed) {
    return (
      <Card className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-lg font-semibold tracking-tight text-foreground">Missing token parameters</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Open Safe Position Builder from a risk report or provide address and price in the URL.
        </p>
        <Link href="/guardian" className="mt-6 inline-flex">
          <Button variant="outline" className="rounded-2xl">
            Back to Guardian
          </Button>
        </Link>
      </Card>
    );
  }

  const entryPrice = Number(parsed.price);
  const priceValid = Number.isFinite(entryPrice) && entryPrice > 0;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return;
    if (!priceValid) {
      toast.error('Invalid entry price.');
      return;
    }

    const params = parsed;
    const positionSizeValue = Number(sizeValue);
    if (!Number.isFinite(positionSizeValue) || positionSizeValue <= 0) {
      toast.error('Enter a valid position size.');
      return;
    }

    const takeProfitNum = takeProfit.trim() ? Number(takeProfit) : undefined;
    if (takeProfit.trim() && (!Number.isFinite(takeProfitNum) || (takeProfitNum ?? 0) <= 0)) {
      toast.error('Enter a valid take-profit percentage.');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/guardian/build', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: params.address,
          chain: params.chain,
          ticker: params.ticker,
          currentPrice: entryPrice,
          positionSizeValue,
          positionSizeType: sizeType,
          takeProfitPercent: takeProfitNum,
        }),
      });

      const json = (await res.json().catch(() => null)) as PositionBuildResult | { error?: string } | null;

      if (!res.ok) {
        toast.error(typeof json === 'object' && json && 'error' in json && json.error ? json.error : 'Could not generate plan');
        return;
      }

      if (json && 'planId' in json) {
        setResult(json);
        toast.success('Safe plan generated');
      }
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;

    setSaving(true);
    try {
      const res = await fetch('/api/guardian/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: result.tokenAddress,
          chain: result.chain,
          ticker: result.ticker,
          entryPrice: result.entryPrice,
          positionSizePercent: result.recommendedSizePercent,
          positionSizeUsdt: result.positionSizeUsdt,
          stopLossPercent: result.recommendedStopLossPercent,
          takeProfitPercent: result.recommendedTakeProfitPercent,
          aiSummary: result.aiSummary,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; planId?: string; error?: string }
        | null;

      if (res.status === 403) {
        toast.error(json?.error ?? 'Daily position limit reached. Upgrade to Pro.');
        return;
      }

      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? 'Could not save plan');
        return;
      }

      const planId =
        json && typeof json === 'object' && 'planId' in json && typeof json.planId === 'string'
          ? json.planId
          : null;
      setSavedPlanId(planId);
      toast.success('Plan saved');
      router.push('/guardian');
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenPosition() {
    if (!result) return;

    setOpening(true);
    try {
      await openPositionWithToast(
        buildOpenPositionFromBuildResult(result, savedPlanId ?? undefined),
        () => router.push('/guardian'),
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className='flex flex-col gap-4'>
        <Link
          href="/guardian"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Guardian
        </Link>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Safe Position Builder
        </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
          Build a safe position
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Size your entry with risk-aware stop-loss and take-profit targets powered by fresh token analysis.
        </p>
      </header>

      <form onSubmit={(e) => void handleGenerate(e)} className="space-y-6">
        <Card className="rounded-3xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Shield className="size-5 text-foreground" strokeWidth={1.5} />
              Position setup
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Token address" value={parsed.address} readOnly mono />
            <Field label="Ticker" value={parsed.ticker ?? '—'} readOnly />
            <Field
              label="Current price (USD)"
              value={priceValid ? entryPrice.toLocaleString(undefined, { maximumFractionDigits: 8 }) : parsed.price}
              readOnly
            />
            {parsed.chain ? <Field label="Chain" value={parsed.chain} readOnly /> : null}

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium">Position size</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Select
                value={sizeType}
                onValueChange={(v) => {
                  if (v === 'percent' || v === 'usdt') setSizeType(v);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">% of deposit</SelectItem>
                  <SelectItem value="usdt">USDT amount</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0.1}
                step={sizeType === 'percent' ? 0.1 : 1}
                value={sizeValue}
                onChange={(e) => setSizeValue(e.target.value)}
                placeholder={sizeType === 'percent' ? 'e.g. 5' : 'e.g. 500'}
                className="h-11 flex-1 rounded-xl border-border"
                disabled={generating}
              />
            </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="take-profit" className="text-sm font-medium">
                Take-profit % <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="take-profit"
                type="number"
                min={1}
                step="0.1"
                placeholder="e.g. 25"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="h-11 max-w-xs rounded-xl border-border"
                disabled={generating}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="h-11 rounded-2xl px-8 cursor-pointer"
          disabled={generating || !priceValid}
        >
          {generating ? 'Generating…' : 'Generate Safe Plan'}
        </Button>
      </form>

      {result ? (
        <PositionPlanRecommendations
          result={result}
          saving={saving}
          opening={opening}
          savedPlanId={savedPlanId}
          onSave={() => void handleSave()}
          onOpenPosition={() => void handleOpenPosition()}
        />
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  readOnly,
  mono,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        readOnly={readOnly}
        value={value}
        className={`h-11 rounded-xl border-border bg-muted/30 ${mono ? 'font-mono text-sm' : ''}`}
      />
    </div>
  );
}
