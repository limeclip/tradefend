import {
  stopLossPriceFromPercent,
  takeProfitPriceFromPercent,
} from '@/lib/guardian/position-prices';
import type { OpenPositionRequest, PositionBuildResult, PositionPlanRow } from '@/lib/guardian/types';

export function buildOpenPositionFromBuildResult(
  result: PositionBuildResult,
  aiPlanId?: string,
): OpenPositionRequest {
  return {
    tokenAddress: result.tokenAddress,
    ticker: result.ticker,
    chain: result.chain,
    entryPrice: result.entryPrice,
    positionSizePercent: result.recommendedSizePercent,
    positionSizeUsdt: result.positionSizeUsdt,
    stopLossPrice: stopLossPriceFromPercent(
      result.entryPrice,
      result.recommendedStopLossPercent,
    ),
    takeProfitPrice: takeProfitPriceFromPercent(
      result.entryPrice,
      result.recommendedTakeProfitPercent,
    ),
    aiPlanId,
  };
}

export function buildOpenPositionFromPlan(plan: PositionPlanRow): OpenPositionRequest {
  return {
    tokenAddress: plan.tokenAddress,
    ticker: plan.ticker ?? undefined,
    chain: plan.chain ?? undefined,
    entryPrice: plan.entryPrice,
    positionSizePercent: plan.positionSizePercent,
    positionSizeUsdt: plan.positionSizeUsdt ?? undefined,
    stopLossPrice: stopLossPriceFromPercent(plan.entryPrice, plan.stopLossPercent),
    takeProfitPrice: takeProfitPriceFromPercent(plan.entryPrice, plan.takeProfitPercent),
    aiPlanId: plan.id,
  };
}
