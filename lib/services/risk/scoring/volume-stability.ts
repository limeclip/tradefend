import { clampScore, lerpScore } from "./_utils";

/**
 * volumeStabilityScore derived from percent change of volume:
 * - If volume dropped > 50% → high risk (0..30)
 * - If volume increased > 100% → also considered risky (possible pump) (0..30)
 * - No/insufficient data → 50
 *
 * Input: volumeChangePercent = (current - previous) / previous * 100
 */
export function volumeStabilityRiskScore(volumeChangePercent?: number | null): number {
  if (volumeChangePercent === null || volumeChangePercent === undefined) return 50;
  if (!Number.isFinite(volumeChangePercent)) return 50;

  const p = volumeChangePercent;

  // Drop scenarios
  if (p <= -50) {
    // -50% => 30 score, -100% => 0 score (cap)
    return clampScore(lerpScore(Math.max(p, -100), -100, -50, 0, 30));
  }
  // Pump scenarios
  if (p >= 100) {
    // 100% => 30 score, 300% => 0 score (cap)
    return clampScore(lerpScore(Math.min(p, 300), 100, 300, 30, 0));
  }

  const abs = Math.abs(p);

  // Stable volume around 0% => high score
  if (abs <= 20) {
    // 0% => 100, 20% => 90
    return clampScore(lerpScore(abs, 0, 20, 100, 90));
  }

  // Moderate move => medium risk
  if (abs <= 50) {
    // 20..50 => 90..70 (still safer than extreme)
    return clampScore(lerpScore(abs, 20, 50, 90, 70));
  }

  // 50..100 => transition to risky band (but not extreme thresholds)
  return clampScore(lerpScore(abs, 50, 100, 70, 40));
}

