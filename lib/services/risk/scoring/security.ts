import { clampScore } from "./_utils";

export function securityScore(goPlusScore: number | null | undefined): number {
  if (goPlusScore === null || goPlusScore === undefined) return 50;
  return clampScore(goPlusScore);
}

