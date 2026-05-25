import type { QuickDecision } from '@/lib/services/risk/quick-decision';

export interface TokenRiskReport {
  query: string;
  tokenAddress?: string;
  chain?: string;
  ticker?: string;
  name?: string;
  scores: {
    liquidity: number; // 0-100, 100 = safest
    concentration: number; // 0-100, 100 = safest
    volatility: number; // 0-100, 100 = safest
    contractSecurity: number; // 0-100, 100 = safest
    devWalletRisk?: number; // 0-100, 100 = safest
    ageRisk?: number; // 0-100, 100 = safest
    volumeStability?: number; // 0-100, 100 = safest
    overall: number; // 0-100, 100 = safest
  };
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  data: {
    liquidityUSD: number;
    volume24h: number;
    priceChange24h: number;
    /** Top‑10 wallets’ share of supply (%). `null` if chain fetch failed without fallback. */
    top10HoldersPercent?: number | null;
    priceUSD: number;
    devSoldPercent?: number | null;
    tokenAgeDays?: number | null;
    volumeStabilityPercentChange?: number | null;
  };
  aiInsight: {
    summary: string;
    recommendation: "SAFE" | "CAUTION" | "AVOID";
    recommendationText: string;
    reasons?: string[];
  };
  quickDecision?: QuickDecision;
  analyzedAt: Date;
}

export interface DexData {
  chain: string;
  tokenAddress?: string;
  /**
   * DexScreener pair address/id, полезно для получения расширенных метрик по pair.
   */
  pairAddress?: string;
  ticker?: string;
  name?: string;
  priceUSD: number;
  liquidityUSD: number;
  volume24h: number;
  priceChange24h: number;
  /**
   * Unix timestamp (seconds or milliseconds depending on upstream).
   * When available, used for token age scoring.
   */
  pairCreatedAt?: number;
}

