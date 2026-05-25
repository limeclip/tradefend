'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { riskScoreStrokeClass, riskScoreTrackClass } from '@/lib/watchlist/risk-styles';

const R = 36;
const CIRC = 2 * Math.PI * R;

type Props = {
  score: number;
  riskLevel: string | null | undefined;
  className?: string;
};

export function WatchlistScoreRing({ score, riskLevel, className }: Props) {
  const v = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const target = CIRC * (1 - v / 100);
  const [dashOffset, setDashOffset] = React.useState(CIRC);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setDashOffset(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className={cn('relative flex size-[88px] shrink-0 items-center justify-center', className)}>
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle
          className={cn('fill-none', riskScoreTrackClass(riskLevel))}
          cx="44"
          cy="44"
          r={R}
          strokeWidth="7"
        />
        <circle
          className={cn(
            'fill-none transition-[stroke-dashoffset] duration-700 ease-out',
            riskScoreStrokeClass(riskLevel),
          )}
          cx="44"
          cy="44"
          r={R}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{v}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Score</p>
      </div>
    </div>
  );
}
