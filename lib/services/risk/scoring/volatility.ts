import { clampScore, lerpScore } from "./_utils";

export function volatilityScore(priceChange24h?: number): number {
  if (priceChange24h === null || priceChange24h === undefined) return 50;
  if (!Number.isFinite(priceChange24h)) return 50;

  const v = Math.abs(priceChange24h);

  if (v > 50) return 0;
  if (v > 20) return clampScore(lerpScore(v, 50, 20, 0, 30));
  if (v > 10) return clampScore(lerpScore(v, 20, 10, 30, 60));
  if (v > 5) return clampScore(lerpScore(v, 10, 5, 60, 90));

  // < 5% → 90..100 (0% is best)
  return clampScore(lerpScore(v, 5, 0, 90, 100));
}

