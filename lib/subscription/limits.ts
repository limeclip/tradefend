import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function getMonthlyLimit(user: Pick<User, "subscriptionPlan">): number {
  return user.subscriptionPlan === "pro_monthly" || user.subscriptionPlan === "pro_yearly" ? 1000 : 5;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

export async function resetMonthlyCheckCountIfNeeded(user: Pick<User, "id" | "monthlyResetDate" | "checksUsedThisMonth">) {
  const now = new Date();
  const shouldReset = !user.monthlyResetDate || !isSameMonth(user.monthlyResetDate, now);
  if (!shouldReset) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      checksUsedThisMonth: 0,
      monthlyResetDate: now,
    },
  });
}

export function canPerformCheck(
  user: Pick<User, "checksUsedThisMonth" | "subscriptionPlan" | "subscriptionStatus">,
): boolean {
  const monthlyLimit = getMonthlyLimit(user);
  const isFreePlan = !user.subscriptionPlan || user.subscriptionPlan === "free";
  const isProActive = user.subscriptionStatus === "active";
  return user.checksUsedThisMonth < monthlyLimit && (isProActive || isFreePlan);
}

export async function incrementCheckCount(user: Pick<User, "id" | "monthlyResetDate" | "checksUsedThisMonth">) {
  const now = new Date();
  const shouldReset = !user.monthlyResetDate || !isSameMonth(user.monthlyResetDate, now);

  if (shouldReset) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        checksUsedThisMonth: 1,
        monthlyResetDate: now,
      },
    });
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      checksUsedThisMonth: { increment: 1 },
    },
  });
}

