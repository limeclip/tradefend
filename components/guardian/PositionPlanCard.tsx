'use client';

import {  Trash } from 'lucide-react';

import { GUARDIAN_CARD_SHELL } from '@/components/guardian/guardian-grid';
import { openPositionWithToast } from '@/components/guardian/use-open-position';
import { Button } from '@/components/ui/button';
import { buildOpenPositionFromPlan } from '@/lib/guardian/open-position';
import { formatUsd } from '@/lib/guardian/position-metrics';
import type { PositionPlanRow } from '@/lib/guardian/types';

type Props = {
  plan: PositionPlanRow;
  hasOpenPosition: boolean;
  opening: boolean;
  deleting?: boolean;
  onViewPlan: () => void;
  onDelete?: () => void;
  onOpenStarted: () => void;
  onOpenEnded: () => void;
  onOpened: () => void;
};

function formatPrice(value: number): string {
  return formatUsd(value, value >= 1 ? 2 : 4);
}

export function PositionPlanCard({
  plan,
  hasOpenPosition,
  opening,
  deleting = false,
  onViewPlan,
  onDelete,
  onOpenStarted,
  onOpenEnded,
  onOpened,
}: Props) {
  const label = plan.ticker ?? plan.tokenAddress.slice(0, 8);
  const created = new Date(plan.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  async function handleOpen() {
    onOpenStarted();
    try {
      await openPositionWithToast(buildOpenPositionFromPlan(plan), onOpened);
    } finally {
      onOpenEnded();
    }
  }

  return (
    <article className={GUARDIAN_CARD_SHELL}>
      <header className="flex items-start justify-between gap-2">
        <section className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{label}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{created}</p>
        </section>
        <div className="flex shrink-0 items-center gap-1">
          {/* <Shield className="size-4 text-muted-foreground" strokeWidth={1.5} aria-hidden /> */}
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
              aria-label="Delete plan"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash className="size-4" />
              {/* <X className="size-4" /> */}
            </Button>
          ) : null}
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
        <Metric label="Entry" value={formatPrice(plan.entryPrice)} />
        <Metric label="Size" value={`${plan.positionSizePercent}%`} />
        <Metric label="Stop loss" value={`${plan.stopLossPercent}%`} />
        <Metric label="Take profit" value={`${plan.takeProfitPercent}%`} />
      </section>

      <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {plan.aiSummary}
      </p>

      <footer className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1 rounded-lg text-[13px] cursor-pointer"
          onClick={onViewPlan}
        >
          View Plan
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 flex-1 rounded-lg text-[13px] cursor-pointer"
          disabled={hasOpenPosition || opening}
          onClick={() => void handleOpen()}
        >
          {hasOpenPosition ? 'Opened' : opening ? 'Opening…' : 'Open Position'}
        </Button>
      </footer>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </section>
  );
}
