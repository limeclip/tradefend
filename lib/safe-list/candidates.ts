import { normalizeTokenAddress } from '@/lib/watchlist/validation';

type DexScreenerPair = {
  chainId?: string;
  baseToken?: { address?: string; symbol?: string };
  liquidity?: { usd?: number };
};

type DexScreenerResponse = {
  pairs?: DexScreenerPair[];
};

export type SafeListCandidate = {
  tokenAddress: string;
  chain: string;
  ticker?: string;
  liquidityUSD: number;
};



// Популярные запросы для поиска (можно расширить, но оставим)
const SEARCH_QUERIES = [
  'ETH', 'WETH', 'USDC', 'USDT', 'WBTC', 'LINK', 'UNI', 'AAVE',
  'PEPE', 'DOGE', 'SHIB', 'FLOKI', 'BONK', 'SUI', 'APT',
];

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeChain(chainId: string): string | null {
  const id = chainId.trim().toLowerCase();
  if (id === 'ethereum' || id === '1') return 'ethereum';
  if (id === 'bsc' || id === '56') return 'bsc';
  return null;
}

export async function fetchSafeListCandidates(maxCandidates = 40): Promise<SafeListCandidate[]> {
  const seen = new Set<string>();
  const candidates: SafeListCandidate[] = [];

  for (const query of SEARCH_QUERIES) {
    if (candidates.length >= maxCandidates) break;

    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) continue;

    const json = (await res.json()) as DexScreenerResponse;
    const pairs = Array.isArray(json.pairs) ? json.pairs : [];
    const sorted = pairs
      .slice()
      .sort((a, b) => toNumber(b.liquidity?.usd) - toNumber(a.liquidity?.usd));

    for (const pair of sorted) {
      const address = pair.baseToken?.address?.trim();
      const chainId = pair.chainId?.trim();
      if (!address || !chainId) continue;

      const chain = normalizeChain(chainId);
      if (!chain) continue; // только ethereum или bsc

      const key = `${chain}:${normalizeTokenAddress(address)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const liquidityUSD = toNumber(pair.liquidity?.usd);
      if (liquidityUSD < 50_000) continue; // минимальная ликвидность 50k USD

      candidates.push({
        tokenAddress: normalizeTokenAddress(address),
        chain,
        ticker: pair.baseToken?.symbol?.trim() || undefined,
        liquidityUSD,
      });

      if (candidates.length >= maxCandidates) break;
    }
  }

  return candidates.sort((a, b) => b.liquidityUSD - a.liquidityUSD).slice(0, maxCandidates);
}