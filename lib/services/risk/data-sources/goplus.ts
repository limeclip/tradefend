import {
  fetchGoPlusTokenSecurityRaw,
  parseGoPlusSecurityScore,
} from '@/lib/services/risk/data-sources/goplus-security';

export async function fetchGoPlusData(address: string, chain: string): Promise<number | null> {
  const raw = await fetchGoPlusTokenSecurityRaw(address, chain);
  return parseGoPlusSecurityScore(raw);
}

