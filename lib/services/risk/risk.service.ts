import type { TokenRiskReport } from "@/lib/services/risk/types";
import { get as cacheGet, set as cacheSet } from "@/lib/services/risk/cache";
import { fetchDexScreenerData } from "@/lib/services/risk/data-sources/dexscreener";
import { fetchGoPlusData } from "@/lib/services/risk/data-sources/goplus";
import { fetchTop10HoldersEvmPercent } from "@/lib/services/risk/data-sources/holders/evm-holders";
import { fetchTop10HoldersSolanaPercent } from "@/lib/services/risk/data-sources/holders/solana-holders";
import { fetchDevWalletSoldPercent } from "@/lib/services/risk/data-sources/dev-wallet";
import { fetchTokenAgeDays } from "@/lib/services/risk/data-sources/token-age";
import { fetchVolumeStabilityPercentChange } from "@/lib/services/risk/data-sources/volume-stability";
import { liquidityScore } from "@/lib/services/risk/scoring/liquidity";
import { concentrationScore } from "@/lib/services/risk/scoring/concentration";
import { volatilityScore } from "@/lib/services/risk/scoring/volatility";
import { securityScore } from "@/lib/services/risk/scoring/security";
import { devWalletRiskScore } from "@/lib/services/risk/scoring/dev-risk";
import { tokenAgeRiskScore } from "@/lib/services/risk/scoring/age-risk";
import { volumeStabilityRiskScore } from "@/lib/services/risk/scoring/volume-stability";
import { generateAIInsight } from "@/lib/services/risk/ai-insights";
import { generateQuickDecision } from "@/lib/services/risk/quick-decision";

class TokenNotFoundError extends Error {
  code = "TOKEN_NOT_FOUND" as const;
  constructor() {
    super("TOKEN_NOT_FOUND");
  }
}

function isEvmAddress(q: string): boolean {
  const s = q.trim();
  return s.startsWith("0x") && s.length >= 42;
}

function riskLevel(overall: number): "LOW" | "MEDIUM" | "HIGH" {
  if (overall >= 70) return "LOW";
  if (overall >= 40) return "MEDIUM";
  return "HIGH";
}

export async function analyzeToken(
  query: string,
  options?: { forceRefresh?: boolean },
): Promise<TokenRiskReport> {
  const q = query.trim();
  if (!q) {
    throw new Error("Missing query");
  }

  const cached = options?.forceRefresh ? null : cacheGet<TokenRiskReport>(q);
  if (cached) return cached;

  const dex = await fetchDexScreenerData(q);
  if (!dex) {
    throw new TokenNotFoundError();
  }

  const tokenAddress = dex.tokenAddress ?? (isEvmAddress(q) ? q : undefined);
  const chain = dex.chain;

  const goPlusRaw =
    tokenAddress && tokenAddress.startsWith("0x")
      ? await fetchGoPlusData(tokenAddress, chain || "ethereum")
      : null;

  const liqScore = liquidityScore(dex.liquidityUSD);
  let top10: number | null | undefined;
  try {
    if (tokenAddress?.startsWith("0x")) {
      top10 = (await fetchTop10HoldersEvmPercent(tokenAddress, chain || "ethereum")) ?? null;
    } else if (tokenAddress) {
      // Solscan path returns numeric fallback (~40%) on API failure — still a definite `number`
      top10 = (await fetchTop10HoldersSolanaPercent(tokenAddress)) ?? null;
    }
  } catch (e) {
    console.error("Failed to fetch top10 holders percent", e);
    top10 = null;
  }

  console.log("[risk.service] Holder concentration inputs", {
    chain,
    mintOrTokenPreview: tokenAddress
      ? tokenAddress.length > 14
        ? `${tokenAddress.slice(0, 10)}…`
        : tokenAddress
      : undefined,
    top10HoldersPercent: top10,
  });
  const concScore = concentrationScore(top10);
  const volScore = volatilityScore(dex.priceChange24h);
  const secScore = securityScore(goPlusRaw);

  // Additional factors (Stage 3):
  let devSoldPercent: number | null = null;
  let tokenAgeDays: number | null = null;
  let volumeStabilityPercentChange: number | null = null;

  try {
    if (tokenAddress?.startsWith("0x")) {
      devSoldPercent = await fetchDevWalletSoldPercent({ tokenAddress, chain });
    } else if (tokenAddress) {
      devSoldPercent = await fetchDevWalletSoldPercent({
        tokenAddress,
        chain,
        solanaMint: tokenAddress,
      });
    }
  } catch (e) {
    console.error("Failed to fetch dev wallet sold percent", e);
    devSoldPercent = null;
  }

  try {
    tokenAgeDays = await fetchTokenAgeDays({
      query: q,
      tokenAddress,
      chain,
      pairCreatedAt: dex.pairCreatedAt,
      solanaMint: tokenAddress?.startsWith("0x") ? undefined : tokenAddress,
    });
  } catch (e) {
    console.error("Failed to fetch token age days", e);
    tokenAgeDays = null;
  }

  try {
    if (dex.pairAddress) {
      volumeStabilityPercentChange = await fetchVolumeStabilityPercentChange({
        query: q,
        tokenAddress,
        chain,
        pairAddress: dex.pairAddress,
      });
    }
  } catch (e) {
    console.error("Failed to fetch volume stability percent change", e);
    volumeStabilityPercentChange = null;
  }

  const devRiskScore = devWalletRiskScore(devSoldPercent);
  const ageRiskScore = tokenAgeRiskScore(tokenAgeDays);
  const volumeStabilityScore = volumeStabilityRiskScore(volumeStabilityPercentChange);

  const overall = Math.round(
    liqScore * 0.25 +
      concScore * 0.25 +
      volScore * 0.15 +
      secScore * 0.15 +
      devRiskScore * 0.1 +
      ageRiskScore * 0.05 +
      volumeStabilityScore * 0.05,
  );
  const lvl = riskLevel(overall);

  const quickDecision = await generateQuickDecision({
    riskLevel: lvl,
    overallScore: overall,
    liquidityScore: liqScore,
    concentrationScore: concScore,
    ticker: dex.ticker,
  });

  const aiInsight = await generateAIInsight({
    liquidityUSD: dex.liquidityUSD,
    liquidityScore: liqScore,
    top10Percent: top10 ?? null,
    concentrationScore: concScore,
    priceChange24h: dex.priceChange24h,
    volatilityScore: volScore,
    securityScore: secScore,
    devSoldPercent,
    devRiskScore,
    tokenAgeDays,
    ageRiskScore,
    volumeStabilityPercentChange,
    volumeStabilityScore,
    overallScore: overall,
    riskLevel: lvl,
  });

  const report: TokenRiskReport = {
    query: q,
    tokenAddress,
    chain,
    ticker: dex.ticker,
    name: dex.name,
    scores: {
      liquidity: liqScore,
      concentration: concScore,
      volatility: volScore,
      contractSecurity: secScore,
      devWalletRisk: devRiskScore,
      ageRisk: ageRiskScore,
      volumeStability: volumeStabilityScore,
      overall,
    },
    riskLevel: lvl,
    data: {
      liquidityUSD: dex.liquidityUSD,
      volume24h: dex.volume24h,
      priceChange24h: dex.priceChange24h,
      top10HoldersPercent: top10 ?? null,
      priceUSD: dex.priceUSD,
      devSoldPercent,
      tokenAgeDays,
      volumeStabilityPercentChange,
    },
    aiInsight,
    quickDecision,
    analyzedAt: new Date(),
  };

  cacheSet(q, report);
  return report;
}

