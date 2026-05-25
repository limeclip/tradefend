const RISK_RANK: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

/**
 * Returns true if risk level has changed (any direction) and previous level exists.
 * Does NOT notify on first check (previousLevel is null/undefined).
 */
export function isSignificantRiskChange(
  previousLevel: string | null | undefined,
  newLevel: string,
): boolean {
  if (!previousLevel || previousLevel === newLevel) {
    return false;
  }

  // Any change (improvement or worsening) is significant
  const prevRank = RISK_RANK[previousLevel.toUpperCase()];
  const nextRank = RISK_RANK[newLevel.toUpperCase()];

  if (prevRank === undefined || nextRank === undefined) {
    // Fallback: if rank unknown, consider change if strings differ
    return previousLevel.toUpperCase() !== newLevel.toUpperCase();
  }

  return prevRank !== nextRank;
}