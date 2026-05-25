import { clampScore, lerpScore } from "./_utils";

/** Neutral concentration score when holder data is unavailable (EVM Moralis gap, incomplete report). */
const SCORE_UNKNOWN = 50;

/**
 * Concentration axis: aggregated **top‑10 share of supply** (0–100%) → score 0–100 (higher = safer / less concentrated).
 *
 * Design goals:
 * - **Stable**: missing/`NaN` maps to midpoint so overall risk isn’t swung without data.
 * - **Interpretable bands** aligned with token risk intuition.
 *
 * Note: Solana holder percents are approximated (popular mints hardcoded) with a generic fallback.
 */
export function concentrationScore(top10HoldersPercent?: number | null): number {
  if (top10HoldersPercent === null || top10HoldersPercent === undefined) return SCORE_UNKNOWN;
  if (!Number.isFinite(top10HoldersPercent)) return SCORE_UNKNOWN;

  const p = Math.max(0, Math.min(100, top10HoldersPercent));

  /*
   * Bands (top10 % of supply):
   * - 0..20%   → low concentration (safe)           100..80
   * - 20..40%  → moderate                             80..50
   * - 40..60%  → concentrated                         50..15
   * - 60..100% → very concentrated                   15..0
   */
  if (p <= 20) return clampScore(lerpScore(p, 0, 20, 100, 80));
  if (p <= 40) return clampScore(lerpScore(p, 20, 40, 80, 50));
  if (p <= 60) return clampScore(lerpScore(p, 40, 60, 50, 15));
  return clampScore(lerpScore(p, 60, 100, 15, 0));
}
