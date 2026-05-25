import { clampScore, lerpScore } from "./_utils";

export function liquidityScore(liquidityUSD: number): number {
  if (!Number.isFinite(liquidityUSD)) return 0;

  if (liquidityUSD < 10_000) return 0;
  if (liquidityUSD < 100_000) return clampScore(lerpScore(liquidityUSD, 10_000, 100_000, 0, 30));
  if (liquidityUSD < 500_000) return clampScore(lerpScore(liquidityUSD, 100_000, 500_000, 30, 60));
  if (liquidityUSD < 2_000_000) return clampScore(lerpScore(liquidityUSD, 500_000, 2_000_000, 60, 90));

  // > 2m → 90..100 (cap at 10m for reaching 100)
  return clampScore(lerpScore(liquidityUSD, 2_000_000, 10_000_000, 90, 100));
}

