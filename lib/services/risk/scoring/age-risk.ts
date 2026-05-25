import { clampScore, lerpScore } from "./_utils";

/**
 * ageRisk: token age risk based on days since creation.
 *
 * Rules:
 * - age < 24h (1 day)  → 0..20
 * - age < 7 days       → 20..50
 * - age > 30 days      → 70..100
 * - missing data       → 50
 */
export function tokenAgeRiskScore(tokenAgeDays?: number | null): number {
  if (tokenAgeDays === null || tokenAgeDays === undefined) return 50;
  if (!Number.isFinite(tokenAgeDays) || tokenAgeDays < 0) return 50;

  const age = tokenAgeDays;

  if (age < 1) {
    // 0..1 day
    return clampScore(lerpScore(age, 0, 1, 0, 20));
  }

  if (age < 7) {
    // 1..7 days
    return clampScore(lerpScore(age, 1, 7, 20, 50));
  }

  if (age < 30) {
    // 7..30 days (not specified explicitly, but helps smooth transitions)
    return clampScore(lerpScore(age, 7, 30, 50, 70));
  }

  // >= 30 days → 70..100
  return clampScore(lerpScore(age, 30, 90, 70, 100));
}

