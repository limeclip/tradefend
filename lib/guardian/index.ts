export { GUARDIAN_CONFIG } from '@/lib/guardian/config';
export { getGuardianStatus, isGuardianEnabled } from '@/lib/guardian/access';
export {
  canBuildPosition,
  FREE_DAILY_POSITION_PLAN_LIMIT,
  incrementPositionCount,
  resetPositionsBuiltIfNeeded,
} from '@/lib/guardian/limits';
export { buildOpenPositionFromBuildResult, buildOpenPositionFromPlan } from '@/lib/guardian/open-position';
export { canOpenPosition, FREE_MAX_OPEN_POSITIONS } from '@/lib/guardian/position-limits';
export {
  stopLossPriceFromPercent,
  takeProfitPriceFromPercent,
} from '@/lib/guardian/position-prices';
export { syncOpenPositionsCount } from '@/lib/guardian/position-sync';
export { buildBuildPositionUrl, parseBuildPositionSearchParams } from '@/lib/guardian/urls';
export { generatePositionRecommendations } from '@/lib/guardian/position-recommendations';
export type {
  GuardianStatus,
  GuardianUserAccess,
  PositionBuildRequest,
  PositionBuildResult,
  OpenPositionRequest,
  PositionPlanRow,
  PositionPlanSaveRequest,
  PositionSizeType,
  UserPositionRow,
} from '@/lib/guardian/types';
