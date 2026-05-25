type DexScreenerPair = {
  chainId?: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
};

type DexScreenerTokenResponse = {
  pairs?: DexScreenerPair[];
};

export type TokenMarketData = {
  priceUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  pairsCount: number;
  fetchedAt: string;
};

const DEXSCREENER_TOKEN_API = 'https://api.dexscreener.com/latest/dex/tokens';

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeChainId(chain?: string | null): string | undefined {
  const c = (chain ?? '').trim().toLowerCase();
  if (!c) return undefined;
  if (c === 'eth' || c === 'ethereum') return 'ethereum';
  if (c === 'bsc' || c === 'binance-smart-chain') return 'bsc';
  return c;
}

function pickBestPair(
  pairs: DexScreenerPair[],
  chainHint?: string,
): DexScreenerPair | null {
  if (!pairs.length) return null;

  const normalizedHint = normalizeChainId(chainHint);
  const filtered = normalizedHint
    ? pairs.filter((p) => normalizeChainId(p.chainId) === normalizedHint)
    : pairs;
  const pool = filtered.length > 0 ? filtered : pairs;

  return (
    pool
      .slice()
      .sort((a, b) => toNumber(b.liquidity?.usd, 0) - toNumber(a.liquidity?.usd, 0))[0] ?? null
  );
}

/** DexScreener embed slug for supported EVM chains. */
export function toDexScreenerEmbedChain(chain?: string | null): 'ethereum' | 'bsc' | null {
  const normalized = normalizeChainId(chain);
  if (normalized === 'ethereum' || normalized === 'bsc') {
    return normalized;
  }
  return null;
}

export function buildDexScreenerEmbedUrl(
  tokenAddress: string,
  chain: 'ethereum' | 'bsc',
): string {
  return `https://dexscreener.com/${chain}/${encodeURIComponent(tokenAddress)}?embed=1&theme=auto`;
}

export function formatMarketPriceUsd(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '$0.00';
  if (usd < 0.01) {
    const fixed = usd.toFixed(8);
    const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
    return `$${trimmed}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

export function formatMarketUsdAmount(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '$0';
  if (usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(1)}M`;
  }
  if (usd >= 1_000) {
    return `$${(usd / 1_000).toFixed(1)}K`;
  }
  return `$${Math.round(usd).toLocaleString('en-US')}`;
}

/**
 * Fetches market metrics from DexScreener (free, no API key).
 * Returns null when the token has no pairs or the request fails.
 */
export async function fetchTokenMarketData(
  tokenAddress: string,
  chainHint?: string,
): Promise<TokenMarketData | null> {
  const address = tokenAddress.trim();
  if (!address) return null;

  const url = `${DEXSCREENER_TOKEN_API}/${encodeURIComponent(address)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const json = (await res.json()) as DexScreenerTokenResponse;
    const pairs = Array.isArray(json.pairs) ? json.pairs : [];
    if (!pairs.length) return null;

    const pair = pickBestPair(pairs, chainHint);
    if (!pair) return null;

    const priceUsd = toNumber(pair.priceUsd, 0);
    const liquidityUsd = toNumber(pair.liquidity?.usd, 0);
    const volume24hUsd = toNumber(pair.volume?.h24, 0);

    if (priceUsd <= 0 && liquidityUsd <= 0 && volume24hUsd <= 0) {
      return null;
    }

    return {
      priceUsd,
      liquidityUsd,
      volume24hUsd,
      pairsCount: pairs.length,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
