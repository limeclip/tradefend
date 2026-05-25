type DexTokenPair = {
  priceUsd?: string;
  liquidity?: { usd?: number };
};

type DexTokenResponse = {
  pairs?: DexTokenPair[];
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function pickBestPair(pairs: DexTokenPair[]): DexTokenPair | null {
  if (!pairs.length) return null;
  return (
    pairs
      .slice()
      .sort((a, b) => toNumber(b.liquidity?.usd, 0) - toNumber(a.liquidity?.usd, 0))[0] ?? null
  );
}

/**
 * Fetches spot USD price from DexScreener (no paid API credits).
 * @see https://docs.dexscreener.com/api/reference
 */
export async function fetchDexScreenerTokenPriceUsd(tokenAddress: string): Promise<number | null> {
  const address = tokenAddress.trim();
  if (!address) return null;

  const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const json = (await res.json()) as DexTokenResponse;
    const pair = pickBestPair(Array.isArray(json.pairs) ? json.pairs : []);
    if (!pair) return null;

    const price = toNumber(pair.priceUsd, 0);
    return price > 0 ? price : null;
  } catch {
    return null;
  }
}
