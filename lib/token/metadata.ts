import type { Metadata } from 'next';

import { getAppUrl } from '@/lib/app-url';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { buildPublicTokenPagePath, buildPublicTokenPageUrl } from '@/lib/token/public-url';

export function buildPublicTokenMetadata(report: TokenRiskReport): Metadata {
  const ticker = report.ticker ?? report.name ?? 'Token';
  const title = `${ticker} Risk Report | Tradefend`;
  const score = report.scores.overall;
  const riskLevel = report.riskLevel;
  const description = `Risk score: ${riskLevel} (overall score: ${score}). Liquidity, concentration, volatility analysis.`;

  const path = buildPublicTokenPagePath(
    report.tokenAddress ?? report.query,
    report.chain,
  );
  const url = buildPublicTokenPageUrl(
    report.tokenAddress ?? report.query,
    report.chain,
  );
  const ogImageUrl = `${getAppUrl()}${path.split('?')[0]}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'Tradefend',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${ticker} risk report on Tradefend`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
