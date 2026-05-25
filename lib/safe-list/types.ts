export type CuratedTokenDto = {
  id: string;
  tokenAddress: string;
  chain: string;
  ticker: string | null;
  riskScore: number;
  riskLevel: string;
  reasonShort: string;
  reasonFull: string | null;
  addedAt: string;
};
