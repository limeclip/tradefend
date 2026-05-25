import { getAppUrl } from '@/lib/app-url';
import { normalizeTokenAddress } from '@/lib/watchlist/validation';

export function buildPublicTokenPagePath(
  tokenAddress: string,
  chain?: string | null,
): string {
  const address = encodeURIComponent(normalizeTokenAddress(tokenAddress));
  const chainQuery = chain?.trim() ? `?chain=${encodeURIComponent(chain.trim().toLowerCase())}` : '';
  return `/token/${address}${chainQuery}`;
}

export function buildPublicTokenPageUrl(
  tokenAddress: string,
  chain?: string | null,
): string {
  return `${getAppUrl()}${buildPublicTokenPagePath(tokenAddress, chain)}`;
}
