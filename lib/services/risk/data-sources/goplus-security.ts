const GO_PLUS_CHAIN_ID: Record<string, string> = {
  ethereum: '1',
  eth: '1',
  bsc: '56',
  'binance-smart-chain': '56',
  polygon: '137',
  matic: '137',
  arbitrum: '42161',
  optimism: '10',
  base: '8453',
  avalanche: '43114',
  avax: '43114',
};

export type GoPlusTokenSecurityRaw = Record<string, string | number | undefined>;

type GoPlusResponse = {
  code?: number;
  message?: string;
  result?: Record<string, GoPlusTokenSecurityRaw>;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseFlag(value: unknown): boolean | null {
  if (value === '1' || value === 1 || value === true) return true;
  if (value === '0' || value === 0 || value === false) return false;
  return null;
}

export function normalizeGoPlusChainId(chain: string): string | null {
  const raw = chain.trim().toLowerCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return raw;
  return GO_PLUS_CHAIN_ID[raw] ?? null;
}

const GOPLUS_AUTH_ERROR_CODES = new Set([4010, 4011, 4012, 4023]);

async function fetchWithTimeout(url: string, headers: HeadersInit): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    return await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGoPlusTokenSecurity(url: string): Promise<GoPlusTokenSecurityRaw | null> {
  // Пробуем сначала без ключа (публичный доступ)
  const headers: HeadersInit = { accept: 'application/json' };
  const res = await fetchWithTimeout(url, headers);
  if (!res?.ok) return null;

  const json = (await res.json()) as GoPlusResponse;
  if (json.code !== undefined && GOPLUS_AUTH_ERROR_CODES.has(json.code)) {
    return null;
  }
  if (json.code !== undefined && json.code !== 1 && json.code !== 0) {
    return null;
  }

  const addrMatch = url.match(/contract_addresses=([^&]+)/i);
  const addr = addrMatch ? decodeURIComponent(addrMatch[1]) : '';
  if (json.result && addr) {
    const row = json.result[addr.toLowerCase()] ?? json.result[addr];
    if (row) return row;
  }
  if (json.result && Object.keys(json.result).length > 0) {
    return Object.values(json.result)[0] ?? null;
  }
  return null;
}

async function requestGoPlusTokenSecurityWithRetry(url: string): Promise<GoPlusTokenSecurityRaw | null> {
  const first = await requestGoPlusTokenSecurity(url);
  if (first) return first;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return requestGoPlusTokenSecurity(url);
}

export async function fetchGoPlusTokenSecurityRaw(
  address: string,
  chain: string,
): Promise<GoPlusTokenSecurityRaw | null> {
  const addr = address.trim();
  if (!addr.startsWith('0x')) return null;

  const chainId = normalizeGoPlusChainId(chain);
  if (!chainId) return null;

  const url = `https://api.gopluslabs.io/api/v1/token_security/${encodeURIComponent(
    chainId,
  )}?contract_addresses=${encodeURIComponent(addr)}`;

  return requestGoPlusTokenSecurityWithRetry(url);
}

export function parseGoPlusSecurityScore(raw: GoPlusTokenSecurityRaw | null): number | null {
  if (!raw) return null;
  const score = toNumber(raw.security_score ?? raw.risk_score);
  if (score === null) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function parseGoPlusFlag(raw: GoPlusTokenSecurityRaw | null, key: string): boolean | null {
  if (!raw) return null;
  return parseFlag(raw[key]);
}

export function parseGoPlusString(raw: GoPlusTokenSecurityRaw | null, key: string): string | null {
  if (!raw) return null;
  const value = raw[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export function parseGoPlusCount(raw: GoPlusTokenSecurityRaw | null, key: string): number | null {
  if (!raw) return null;
  return toNumber(raw[key]);
}