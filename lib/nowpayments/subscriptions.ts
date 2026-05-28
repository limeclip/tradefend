export type PlanId = "monthly" | "yearly";

export type LocalPlanConfig = {
  title: string;
  intervalDay: number;
  amount: number;
  currency: "usd";
  dbPlan: "pro_monthly" | "pro_yearly";
  descriptionTag: "monthly" | "yearly";
  fallbackPlanId?: number;
  envPlanId?: number;
};

const monthlyEnvPlanId = Number(process.env.NOWPAYMENTS_PLAN_ID_MONTHLY);
const yearlyEnvPlanId = Number(process.env.NOWPAYMENTS_PLAN_ID_YEARLY);

function normalizePlanId(value: number): number | undefined {
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export const SUBSCRIPTION_PLANS: Record<PlanId, LocalPlanConfig> = {
  monthly: {
    title: "Pro Monthly",
    intervalDay: 31,
    amount: 12.99,
    currency: "usd",
    dbPlan: "pro_monthly",
    descriptionTag: "monthly",
    fallbackPlanId: 1535298971,
    envPlanId: normalizePlanId(monthlyEnvPlanId),
  },
  yearly: {
    title: "Pro Yearly",
    intervalDay: 365,
    amount: 99,
    currency: "usd",
    dbPlan: "pro_yearly",
    descriptionTag: "yearly",
    fallbackPlanId: 856620025,
    envPlanId: normalizePlanId(yearlyEnvPlanId),
  },
};

export function parsePlanId(value: unknown): PlanId | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

export function resolveSubscriptionPlan(nowPlanId: number): "pro_monthly" | "pro_yearly" {
  const monthly = SUBSCRIPTION_PLANS.monthly;
  if (
    nowPlanId === monthly.fallbackPlanId ||
    (typeof monthly.envPlanId === "number" && nowPlanId === monthly.envPlanId)
  ) {
    return "pro_monthly";
  }
  return "pro_yearly";
}

export function getPlanByDescription(orderDescription: string | null): PlanId | null {
  if (!orderDescription) {
    return null;
  }
  const normalized = orderDescription.trim().toLowerCase();
  if (normalized.includes("plan:monthly")) {
    return "monthly";
  }
  if (normalized.includes("plan:yearly")) {
    return "yearly";
  }
  return null;
}
