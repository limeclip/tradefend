import { clampScore, lerpScore } from "./_utils";

/**
 * devWalletRisk: activity risk of the token creator/developer wallet.
 * Input: devSoldPercent (dev wallet sold as % of their holdings) in last 7 days.
 *
 * Scoring heuristics:
 * - No data → neutral 50
 * - devSoldPercent > 10% → high risk (0..30)
 */
export function devWalletRiskScore(devSoldPercent?: number | null): number {
  if (devSoldPercent === null || devSoldPercent === undefined) return 50;
  if (!Number.isFinite(devSoldPercent)) return 50;

  const p = Math.max(0, devSoldPercent);

  // If dev sold more than 10% recently => dangerous.
  if (p > 10) {
    // Map: 10% => 30 score, 60% => 0 score
    return clampScore(lerpScore(p, 10, 60, 30, 0));
  }

  // Lower dev selling => safer. 0% => 100, 10% => 70
  return clampScore(lerpScore(p, 0, 10, 100, 70));
}

