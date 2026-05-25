import type { TokenRiskReport } from '@/lib/services/risk/types';

type JsonLdObject = Record<string, unknown>;

export function buildTokenRiskJsonLd(report: TokenRiskReport): JsonLdObject {
  const ticker = report.ticker ?? report.name ?? 'Token';
  const score = report.scores.overall;
  const riskLevel = report.riskLevel;

  const description = `Risk score: ${riskLevel} (overall score: ${score}). Liquidity, concentration, volatility analysis.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ticker,
    description,
    brand: {
      '@type': 'Brand',
      name: 'Tradefend',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'riskLevel',
        value: riskLevel,
      },
      {
        '@type': 'PropertyValue',
        name: 'riskScore',
        value: String(score),
      },
      {
        '@type': 'PropertyValue',
        name: 'liquidityScore',
        value: String(report.scores.liquidity),
      },
      {
        '@type': 'PropertyValue',
        name: 'concentrationScore',
        value: String(report.scores.concentration),
      },
      {
        '@type': 'PropertyValue',
        name: 'volatilityScore',
        value: String(report.scores.volatility),
      },
    ],
  };
}
