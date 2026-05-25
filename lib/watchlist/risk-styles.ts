export function riskStripeClass(level: string | null | undefined): string {
  if (level === 'LOW') return 'bg-emerald-500 dark:bg-emerald-400';
  if (level === 'MEDIUM') return 'bg-amber-500 dark:bg-amber-400';
  if (level === 'HIGH') return 'bg-red-500 dark:bg-red-400';
  return 'bg-zinc-300 dark:bg-zinc-600';
}

export function riskBadgeClass(level: string | null | undefined): string {
  if (level === 'LOW')
    return 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (level === 'MEDIUM')
    return 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
  if (level === 'HIGH')
    return 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  return 'bg-muted text-muted-foreground';
}

export function riskScoreStrokeClass(level: string | null | undefined): string {
  if (level === 'LOW') return 'stroke-emerald-500 dark:stroke-emerald-400';
  if (level === 'MEDIUM') return 'stroke-amber-500 dark:stroke-amber-400';
  if (level === 'HIGH') return 'stroke-red-500 dark:stroke-red-400';
  return 'stroke-zinc-400 dark:stroke-zinc-500';
}

export function riskScoreTrackClass(level: string | null | undefined): string {
  if (level === 'LOW') return 'stroke-emerald-500/15 dark:stroke-emerald-400/20';
  if (level === 'MEDIUM') return 'stroke-amber-500/15 dark:stroke-amber-400/20';
  if (level === 'HIGH') return 'stroke-red-500/15 dark:stroke-red-400/20';
  return 'stroke-zinc-200 dark:stroke-zinc-700';
}
