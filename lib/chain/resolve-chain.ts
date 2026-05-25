import { normalizeTokenAddress } from '@/lib/watchlist/validation';

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Infer default chain from address format when not provided in the URL. */
export function inferChainFromAddress(address: string): string | undefined {
  const trimmed = address.trim();
  if (trimmed.startsWith('0x') && trimmed.length >= 42) {
    return 'ethereum';
  }
  if (SOLANA_ADDRESS_RE.test(trimmed)) {
    return 'solana';
  }
  return undefined;
}

export function resolvePublicTokenParams(
  rawAddress: string,
  chainParam?: string | null,
): { tokenAddress: string; chainHint: string | undefined } {
  const tokenAddress = normalizeTokenAddress(rawAddress);
  const chainHint = chainParam?.trim().toLowerCase() || inferChainFromAddress(tokenAddress);
  return { tokenAddress, chainHint };
}
