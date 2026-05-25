import type { AnalysisResult } from '@/lib/risk/analyze-token';

export type CompareTokenResult = {
  address: string;
  ticker: string | null;
  success: boolean;
  data?: AnalysisResult;
  error?: string;
};

export type CompareApiResponse = {
  results: CompareTokenResult[];
};

export const COMPARE_MIN = 2;
export const COMPARE_MAX = 5;

export const COMPARE_STORAGE_KEY = 'tradefend_compare_last';

export type StoredCompareState = {
  addresses: string[];
  chain: string;
};
