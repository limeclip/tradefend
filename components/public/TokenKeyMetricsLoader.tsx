import { getCachedTokenMarketData } from '@/lib/token-cache/get-public-report';
import type { TokenRiskReport } from '@/lib/services/risk/types';

import { TokenKeyMetrics } from './TokenKeyMetrics';

type TokenKeyMetricsLoaderProps = {
  tokenAddress: string;
  chainHint?: string;
  report: TokenRiskReport;
};

export async function TokenKeyMetricsLoader({
  tokenAddress,
  chainHint,
  report,
}: TokenKeyMetricsLoaderProps) {
  const marketData = await getCachedTokenMarketData(tokenAddress, chainHint, report);
  if (!marketData) return null;
  return <TokenKeyMetrics marketData={marketData} />;
}
