import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import {
  parsePlanId,
  resolvePlanIdFromNowPlanId,
  SUBSCRIPTION_PLANS,
  type PlanId,
} from "@/lib/nowpayments/subscriptions";
import { prisma } from "@/lib/prisma";

type NowPaymentsWebhookPayload = {
  event_type?: unknown;
  event?: unknown;
  payment_status?: unknown;
  order_id?: unknown;
  order_description?: unknown;
  payment_id?: unknown;
  status?: unknown;
  customer_email?: unknown;
  subscription_plan_id?: unknown;
  expire_date?: unknown;
};

function parsePayload(raw: string): NowPaymentsWebhookPayload | null {
  try {
    return JSON.parse(raw) as NowPaymentsWebhookPayload;
  } catch {
    return null;
  }
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function isValidSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) {
    return false;
  }

  const parsed = parsePayload(rawBody);
  if (!parsed) {
    return false;
  }

  const sortedBody = JSON.stringify(sortObject(parsed));
  const expectedSignature = createHmac("sha512", secret).update(sortedBody).digest("hex");
  const receivedSignature = signatureHeader.trim().toLowerCase();

  if (expectedSignature.length !== receivedSignature.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function addDays(baseDate: Date, days: number): Date {
  const result = new Date(baseDate);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function parseExpireDate(value: unknown): Date | null {
  const raw = asString(value);
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function activateSubscription(params: {
  subscriptionId: string | null;
  customerEmail: string | null;
  nowPlanId: number | null;
  paymentId: string | null;
  expireDate: Date | null;
}): Promise<void> {
  const { subscriptionId, customerEmail, nowPlanId, paymentId, expireDate } = params;

  let userId: string | null = null;
  let localPlanId: PlanId | null = null;

  if (subscriptionId) {
    const order = await prisma.payProOrder.findUnique({
      where: { orderId: subscriptionId },
      select: { userId: true, planId: true },
    });
    if (order) {
      userId = order.userId;
      localPlanId = parsePlanId(order.planId);
    }
  }

  if (!userId && customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId) {
    console.error("NOWPayments webhook: user not found", { subscriptionId, customerEmail });
    return;
  }

  if (!localPlanId && nowPlanId !== null) {
    localPlanId = resolvePlanIdFromNowPlanId(nowPlanId);
  }

  if (!localPlanId) {
    console.error("NOWPayments webhook: plan not resolved", { nowPlanId, subscriptionId });
    return;
  }

  const planConfig = SUBSCRIPTION_PLANS[localPlanId];
  const now = new Date();
  const subscriptionExpiresAt = expireDate ?? addDays(now, planConfig.intervalDay);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: planConfig.dbPlan,
      subscriptionStatus: "active",
      subscriptionExpiresAt,
      payproSubscriptionId: paymentId ?? subscriptionId ?? undefined,
      checksUsedThisMonth: 0,
      monthlyResetDate: now,
    },
  });

  if (subscriptionId) {
    await prisma.payProOrder.updateMany({
      where: { orderId: subscriptionId },
      data: { status: "paid" },
    });
  }
}

export async function POST(request: Request) {
  try {
    
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
    if (!ipnSecret) {
      console.error("NOWPayments IPN secret not configured");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-nowpayments-sig");

    if (!isValidSignature(rawBody, signature, ipnSecret)) {
      console.error("NOWPayments webhook: invalid signature");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const payload = parsePayload(rawBody);
    if (!payload) {
      console.error("NOWPayments webhook: invalid JSON payload");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const eventType =
      asString(payload.event_type) ?? asString(payload.event) ?? asString(payload.status)?.toLowerCase();

    const isActivation =
      eventType === "subscription_activated" ||
      eventType === "invoice_paid" ||
      eventType === "payment_finished";

    if (isActivation) {
      const subscriptionId = asString(payload.order_id);
      const customerEmail = asString(payload.customer_email);
      const nowPlanId = asNumber(payload.subscription_plan_id);
      const paymentId = asString(payload.payment_id);
      const expireDate = parseExpireDate(payload.expire_date);

      await activateSubscription({
        subscriptionId,
        customerEmail,
        nowPlanId,
        paymentId,
        expireDate,
      });
    }
  } catch (error) {
    console.error("NOWPayments webhook error:", error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
