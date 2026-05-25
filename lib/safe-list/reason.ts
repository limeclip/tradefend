import type { TokenRiskReport } from '@/lib/services/risk/types';
import {
  fetchGoPlusTokenSecurityRaw,
  parseGoPlusFlag,
} from '@/lib/services/risk/data-sources/goplus-security';

export function buildReasonShort(report: TokenRiskReport): string {
  const parts: string[] = [];
  const liquidityUsd = report.data.liquidityUSD;

  if (liquidityUsd >= 500_000) {
    parts.push('High liquidity (>500k)');
  } else if (liquidityUsd >= 100_000) {
    parts.push('Solid liquidity (>100k)');
  }

  if (report.scores.concentration >= 60) {
    parts.push('Good holder distribution');
  }

  if (report.scores.contractSecurity >= 70) {
    parts.push('Strong contract security');
  }

  if (parts.length === 0) {
    parts.push('Low overall risk profile');
  }

  return parts.slice(0, 2).join(' · ');
}

export async function buildReasonFull(report: TokenRiskReport): Promise<string | null> {
  const lines = [
    `Overall score ${report.scores.overall}/100 (${report.riskLevel}).`,
    `Liquidity score ${report.scores.liquidity}, concentration ${report.scores.concentration}, volatility ${report.scores.volatility}.`,
    report.aiInsight.summary,
  ];

  if (report.tokenAddress?.startsWith('0x') && report.chain) {
    const raw = await fetchGoPlusTokenSecurityRaw(report.tokenAddress, report.chain);
    const honeypot = parseGoPlusFlag(raw, 'is_honeypot');
    const mintable = parseGoPlusFlag(raw, 'is_mintable');
    if (honeypot === false && mintable === false) {
      lines.push('No honeypot flags detected via GoPlus.');
    }
  }

  return lines.join(' ');
}
