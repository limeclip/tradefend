export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function lerpScore(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (!Number.isFinite(x)) return 50;
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

