import { prisma } from '@/lib/prisma';
import type { TokenMarketData } from '@/lib/token-cache/market-data';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { normalizeTokenAddress } from '@/lib/watchlist/validation';

import { TOKEN_CACHE_TTL_MS } from './constants';
import {
  deserializeTokenCachePayload,
  serializeTokenCachePayload,
} from './serialize';

function cacheExpiryFromNow(): Date {
  return new Date(Date.now() + TOKEN_CACHE_TTL_MS);
}

export type CachedTokenRow = {
  report: TokenRiskReport;
  marketData: TokenMarketData | null;
};

async function readCacheRow(
  tokenAddress: string,
  chainHint?: string,
): Promise<CachedTokenRow | null> {
  const normalized = normalizeTokenAddress(tokenAddress);
  const now = new Date();

  let row =
    chainHint
      ? await prisma.tokenCache.findUnique({
          where: {
            tokenAddress_chain: {
              tokenAddress: normalized,
              chain: chainHint,
            },
          },
        })
      : null;

  if (!row) {
    row = await prisma.tokenCache.findFirst({
      where: {
        tokenAddress: normalized,
        expiresAt: { gt: now },
      },
      orderBy: { analyzedAt: 'desc' },
    });
  }

  if (!row || row.expiresAt <= now) return null;

  const { report, marketData } = deserializeTokenCachePayload(row.reportJson);
  if (!report) return null;
  return { report, marketData };
}

export async function getValidTokenCache(
  tokenAddress: string,
  chainHint?: string,
): Promise<TokenRiskReport | null> {
  const cached = await readCacheRow(tokenAddress, chainHint);
  return cached?.report ?? null;
}

export async function getValidTokenCacheMarketData(
  tokenAddress: string,
  chainHint?: string,
): Promise<TokenMarketData | null> {
  const cached = await readCacheRow(tokenAddress, chainHint);
  return cached?.marketData ?? null;
}

export async function upsertTokenCache(
  report: TokenRiskReport,
  marketData?: TokenMarketData | null,
): Promise<void> {
  const tokenAddress = report.tokenAddress
    ? normalizeTokenAddress(report.tokenAddress)
    : normalizeTokenAddress(report.query);
  const chain = (report.chain ?? 'unknown').trim().toLowerCase();
  const expiresAt = cacheExpiryFromNow();

  let preservedMarketData: TokenMarketData | null | undefined = marketData;
  if (marketData === undefined) {
    const existing = await prisma.tokenCache.findUnique({
      where: { tokenAddress_chain: { tokenAddress, chain } },
    });
    if (existing) {
      preservedMarketData = deserializeTokenCachePayload(existing.reportJson).marketData;
    }
  }

  await prisma.tokenCache.upsert({
    where: {
      tokenAddress_chain: { tokenAddress, chain },
    },
    create: {
      tokenAddress,
      chain,
      reportJson: serializeTokenCachePayload(report, preservedMarketData ?? null),
      expiresAt,
      analyzedAt: report.analyzedAt,
    },
    update: {
      reportJson: serializeTokenCachePayload(report, preservedMarketData ?? null),
      expiresAt,
      analyzedAt: report.analyzedAt,
    },
  });
}

export async function upsertTokenCacheMarketData(
  report: TokenRiskReport,
  marketData: TokenMarketData | null,
): Promise<void> {
  const tokenAddress = report.tokenAddress
    ? normalizeTokenAddress(report.tokenAddress)
    : normalizeTokenAddress(report.query);
  const chain = (report.chain ?? 'unknown').trim().toLowerCase();
  const expiresAt = cacheExpiryFromNow();

  const existing = await prisma.tokenCache.findUnique({
    where: { tokenAddress_chain: { tokenAddress, chain } },
  });

  if (existing && existing.expiresAt > new Date()) {
    await prisma.tokenCache.update({
      where: { tokenAddress_chain: { tokenAddress, chain } },
      data: {
        reportJson: serializeTokenCachePayload(report, marketData),
        expiresAt,
      },
    });
    return;
  }

  await upsertTokenCache(report, marketData);
}
