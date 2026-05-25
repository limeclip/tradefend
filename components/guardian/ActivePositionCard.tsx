'use client';

import { Shield } from 'lucide-react';

import { RiskLevelBadge } from '@/components/guardian/RiskLevelBadge';
import { GUARDIAN_CARD_SHELL } from '@/components/guardian/guardian-grid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatSignedPercent, formatUsd } from '@/lib/guardian/position-metrics';
import type { UserPositionRow } from '@/lib/guardian/types';
import { cn } from '@/lib/utils';

type Props = {
  position: UserPositionRow;
  closing: boolean;
  onClose: () => void;
};

function formatPrice(value: number): string {
  return formatUsd(value, value >= 1 ? 2 : 4);
}

export function ActivePositionCard({ position, closing, onClose }: Props) {
  const label = position.ticker ?? position.tokenAddress.slice(0, 8);
  const current = position.currentPrice ?? null;
  const pnlPercent = position.pnlPercent ?? null;
  const pnlUsd = position.pnlUsd ?? null;
  const isProfit = pnlPercent !== null && pnlPercent >= 0;
  const progress = position.slTpProgress ?? 0;
  const pctToSl = position.percentToSl;
  const pctToTp = position.percentToTp;

  const pnlInline =
    pnlPercent !== null
      ? ` (${formatSignedPercent(pnlPercent)}${pnlUsd !== null ? `, ${pnlUsd >= 0 ? '+' : '-'}${formatUsd(Math.abs(pnlUsd), 0)}` : ''})`
      : '';

  return (
    <article className={GUARDIAN_CARD_SHELL}>
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{label}</h3>
          <RiskLevelBadge level={position.currentRiskLevel} />
        </div>
        <Shield className="size-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          disabled={closing}
          aria-label="Close position"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button> */}
      </header>

      <div className="mt-3 space-y-1">
        <p className="text-[13px] text-muted-foreground">Price</p>
        <p className="text-sm font-medium leading-snug text-foreground">
          Entry {formatPrice(position.entryPrice)}
          {current !== null ? (
            <>
              <span className="text-muted-foreground"> | </span>
              Current {formatPrice(current)}
              <span
                className={cn(
                  'ml-1 text-[13px] font-medium',
                  isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                )}
              >
                {pnlInline}
              </span>
            </>
          ) : (
            <span className="ml-1 text-[13px] font-medium text-muted-foreground">· updating…</span>
          )}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>SL {formatPrice(position.stopLossPrice)}</span>
          <span>TP {formatPrice(position.takeProfitPrice)}</span>
        </div>
        <Progress value={progress} indicatorClassName="bg-foreground/70" />
        <div className="flex justify-between text-[13px] font-medium text-foreground/80">
          <span>
            {pctToSl !== null && pctToSl !== undefined
              ? `-${Math.max(0, pctToSl).toFixed(1)}% to SL`
              : '— to SL'}
          </span>
          <span>
            {pctToTp !== null && pctToTp !== undefined
              ? `+${Math.max(0, pctToTp).toFixed(1)}% to TP`
              : '— to TP'}
          </span>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between gap-2 pt-4">
        <p className="text-[13px] text-muted-foreground">
          {position.positionSizePercent != null ? `Size ${position.positionSizePercent}%` : ''}
          {position.positionSizeUsdt != null
            ? `${position.positionSizePercent != null ? ' · ' : 'Size '}${formatUsd(position.positionSizeUsdt, 0)}`
            : ''}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg px-3 text-[13px] cursor-pointer"
          disabled={closing}
          onClick={onClose}
        >
          {closing ? 'Closing…' : 'Close'}
        </Button>
      </footer>
    </article>
  );
}
