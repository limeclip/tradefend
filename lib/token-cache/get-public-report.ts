import { analyzeToken, isTokenNotFoundError } from '@/lib/risk/analyze-token';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { resolvePublicTokenParams } from '@/lib/chain/resolve-chain';

import {
  getValidTokenCache,
  getValidTokenCacheMarketData,
  upsertTokenCache,
  upsertTokenCacheMarketData,
} from './repository';
import { fetchTokenMarketData, type TokenMarketData } from './market-data';

export type PublicTokenPageData = {
  report: TokenRiskReport;
};

export class PublicTokenNotFoundError extends Error {
  readonly code = 'TOKEN_NOT_FOUND' as const;

  constructor() {
    super('TOKEN_NOT_FOUND');
    this.name = 'PublicTokenNotFoundError';
  }
}

export async function getPublicTokenPageData(
  rawAddress: string,
  chainParam?: string | null,
  options?: { forceRefresh?: boolean },
): Promise<PublicTokenPageData> {
  const { tokenAddress, chainHint } = resolvePublicTokenParams(rawAddress, chainParam);
  const forceRefresh = options?.forceRefresh === true;

  let report: TokenRiskReport | null = null;

  if (!forceRefresh) {
    report = await getValidTokenCache(tokenAddress, chainHint);
  }

  if (!report) {
    try {
      report = await analyzeToken(tokenAddress, chainHint, { skipCreditCheck: true });
    } catch (err) {
      if (isTokenNotFoundError(err)) {
        throw new PublicTokenNotFoundError();
      }
      throw err;
    }
    await upsertTokenCache(report);
  }

  return { report };
}

/**
 * Returns cached market metrics or fetches from DexScreener once per cache TTL.
 */
export async function getCachedTokenMarketData(
  tokenAddress: string,
  chainHint: string | undefined,
  report: TokenRiskReport,
): Promise<TokenMarketData | null> {
  const chain = chainHint ?? report.chain;
  const cached = await getValidTokenCacheMarketData(tokenAddress, chain);
  if (cached) return cached;

  const fetched = await fetchTokenMarketData(tokenAddress, chain);
  await upsertTokenCacheMarketData(report, fetched);
  return fetched;
}
