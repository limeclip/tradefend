const RISK_LEVELS = new Set(["LOW", "MEDIUM", "HIGH"]);

export type AddWatchlistInput = {
  tokenAddress: string;
  ticker?: string;
  chain?: string;
  lastRiskScore?: number;
  lastRiskLevel?: string;
  notifyOnChange?: boolean;
  notes?: unknown;
};

export function normalizeTokenAddress(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("0x")) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

export function parseAddWatchlistBody(body: unknown): AddWatchlistInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body" };
  }

  const raw = body as Record<string, unknown>;
  const tokenAddress =
    typeof raw.tokenAddress === "string" ? normalizeTokenAddress(raw.tokenAddress) : "";
  if (!tokenAddress) {
    return { error: "Missing tokenAddress" };
  }

  const ticker = typeof raw.ticker === "string" ? raw.ticker.trim() || undefined : undefined;
  const chain = typeof raw.chain === "string" ? raw.chain.trim() || undefined : undefined;

  let lastRiskScore: number | undefined;
  if (raw.lastRiskScore !== undefined && raw.lastRiskScore !== null) {
    if (typeof raw.lastRiskScore !== "number" || !Number.isInteger(raw.lastRiskScore)) {
      return { error: "lastRiskScore must be an integer" };
    }
    if (raw.lastRiskScore < 0 || raw.lastRiskScore > 100) {
      return { error: "lastRiskScore must be between 0 and 100" };
    }
    lastRiskScore = raw.lastRiskScore;
  }

  let lastRiskLevel: string | undefined;
  if (typeof raw.lastRiskLevel === "string" && raw.lastRiskLevel.trim()) {
    const level = raw.lastRiskLevel.trim().toUpperCase();
    if (!RISK_LEVELS.has(level)) {
      return { error: "lastRiskLevel must be LOW, MEDIUM, or HIGH" };
    }
    lastRiskLevel = level;
  }

  const notifyOnChange =
    typeof raw.notifyOnChange === "boolean" ? raw.notifyOnChange : undefined;

  const notes = raw.notes !== undefined ? raw.notes : undefined;

  return {
    tokenAddress,
    ticker,
    chain,
    lastRiskScore,
    lastRiskLevel,
    notifyOnChange,
    notes,
  };
}
