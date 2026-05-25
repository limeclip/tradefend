import type { DexData } from "@/lib/services/risk/types";

type DexScreenerPair = {
  chainId?: string;
  pairCreatedAt?: string | number;
  pairAddress?: string;
  baseToken?: { address?: string; symbol?: string; name?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
};

type DexScreenerResponse = {
  pairs?: DexScreenerPair[];
};

function toNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function pickBestPair(pairs: DexScreenerPair[]): DexScreenerPair | null {
  if (!pairs.length) return null;
  return (
    pairs
      .slice()
      .sort((a, b) => toNumber(b.liquidity?.usd, 0) - toNumber(a.liquidity?.usd, 0))[0] ?? null
  );
}

export async function fetchDexScreenerData(query: string): Promise<DexData | null> {
  const q = query.trim();
  if (!q) return null;

  const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    // DexScreener data is near-real-time; allow Next to cache only if caller wants it.
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as DexScreenerResponse;
  const pair = pickBestPair(Array.isArray(json.pairs) ? json.pairs : []);
  if (!pair) return null;

  const pairCreatedAtRaw = toNumber(pair.pairCreatedAt, 0);

  return {
    chain: pair.chainId ?? "unknown",
    tokenAddress: pair.baseToken?.address,
    pairAddress: pair.pairAddress,
    ticker: pair.baseToken?.symbol,
    name: pair.baseToken?.name,
    priceUSD: toNumber(pair.priceUsd, 0),
    liquidityUSD: toNumber(pair.liquidity?.usd, 0),
    volume24h: toNumber(pair.volume?.h24, 0),
    priceChange24h: toNumber(pair.priceChange?.h24, 0),
    pairCreatedAt: pairCreatedAtRaw > 0 ? pairCreatedAtRaw : undefined,
  };
}

