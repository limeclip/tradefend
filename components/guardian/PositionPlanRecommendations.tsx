'use client';

import { SparkleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PositionBuildResult } from '@/lib/guardian/types';

type Props = {
  result: PositionBuildResult;
  saving: boolean;
  opening: boolean;
  savedPlanId: string | null;
  onSave: () => void;
  onOpenPosition: () => void;
};

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
        {suffix ? <span className="ml-0.5 text-base font-medium text-muted-foreground">{suffix}</span> : null}
      </p>
    </div>
  );
}

export function PositionPlanRecommendations({
  result,
  saving,
  opening,
  savedPlanId,
  onSave,
  onOpenPosition,
}: Props) {
  return (
    <Card className="rounded-3xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-muted/50">
            <SparkleIcon className="size-4 text-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">AI Safe Plan</CardTitle>
            <p className="text-xs text-muted-foreground">
              {result.usedAi ? 'Generated with AI' : 'Rule-based recommendations'}
              {' · '}
              Risk: {result.riskLevel}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Size" value={result.recommendedSizePercent} suffix="%" />
          <Metric label="Stop loss" value={result.recommendedStopLossPercent} suffix="%" />
          <Metric label="Take profit" value={result.recommendedTakeProfitPercent} suffix="%" />
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-sm leading-relaxed text-foreground/90">{result.aiSummary}</p>
        </div>
        <section className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-2xl cursor-pointer"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? 'Saving…' : savedPlanId ? 'Plan Saved' : 'Save Plan'}
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 rounded-2xl cursor-pointer"
            disabled={opening}
            onClick={onOpenPosition}
          >
            {opening ? 'Opening…' : 'Open Position'}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
