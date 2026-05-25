/** User fields required to evaluate Guardian access. */
export type GuardianUserAccess = {
  guardianEnabled: boolean;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
};

/** API / UI status payload for the Guardian feature. */
export type GuardianStatus = {
  enabled: boolean;
  source: 'flag' | 'subscription' | 'none';
};

export type PositionSizeType = 'percent' | 'usdt';

/** Request body for POST /api/guardian/build */
export type PositionBuildRequest = {
  tokenAddress: string;
  chain?: string;
  ticker?: string;
  currentPrice: number;
  positionSizeValue: number;
  positionSizeType: PositionSizeType;
  takeProfitPercent?: number;
};

/** Response from POST /api/guardian/build (plan not persisted yet). */
export type PositionBuildResult = {
  planId: string;
  tokenAddress: string;
  chain?: string;
  ticker?: string;
  entryPrice: number;
  positionSizePercent: number;
  positionSizeUsdt?: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  recommendedSizePercent: number;
  recommendedStopLossPercent: number;
  recommendedTakeProfitPercent: number;
  aiSummary: string;
  riskLevel: string;
  scores: {
    volatility: number;
    concentration: number;
    overall: number;
  };
  usedAi: boolean;
};

/** Request body for POST /api/guardian/plan */
export type PositionPlanSaveRequest = {
  tokenAddress: string;
  chain?: string;
  ticker?: string;
  entryPrice: number;
  positionSizePercent: number;
  positionSizeUsdt?: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  aiSummary: string;
};

/** Request body for POST /api/guardian/positions */
export type OpenPositionRequest = {
  tokenAddress: string;
  ticker?: string;
  chain?: string;
  entryPrice: number;
  positionSizePercent?: number;
  positionSizeUsdt?: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  aiPlanId?: string;
};

/** Open position row returned from API (enriched for dashboard cards). */
export type UserPositionRow = {
  id: string;
  tokenAddress: string;
  ticker: string | null;
  chain: string | null;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSizePercent: number | null;
  positionSizeUsdt: number | null;
  status: string;
  createdAt: string;
  aiPlanId?: string | null;
  currentPrice?: number | null;
  currentRiskLevel?: string | null;
  pnlPercent?: number | null;
  pnlUsd?: number | null;
  percentToSl?: number | null;
  percentToTp?: number | null;
  slTpProgress?: number | null;
};

/** Saved plan row returned to the client. */
export type PositionPlanRow = {
  id: string;
  tokenAddress: string;
  ticker: string | null;
  chain: string | null;
  entryPrice: number;
  positionSizePercent: number;
  positionSizeUsdt: number | null;
  stopLossPercent: number;
  takeProfitPercent: number;
  aiSummary: string;
  createdAt: string;
};
