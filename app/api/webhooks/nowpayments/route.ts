import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { resolveSubscriptionPlan } from "@/lib/nowpayments/subscriptions";
import { prisma } from "@/lib/prisma";

type NowPaymentsWebhookPayload = {
  event_type?: unknown;
  event?: unknown;
  order_id?: unknown;
  subscription_id?: unknown;
  subscription_plan_id?: unknown;
  plan_id?: unknown;
  next_payment_date?: unknown;
  expiration_date?: unknown;
  status?: unknown;
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
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function parseExpirationDate(payload: NowPaymentsWebhookPayload): Date | null {
  const nextPaymentDate = asString(payload.next_payment_date);
  const expirationDate = asString(payload.expiration_date);
  const isoDate = nextPaymentDate ?? expirationDate;
  if (!isoDate) {
    return null;
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
    if (!ipnSecret) {
      return NextResponse.json({ error: "NOWPayments IPN secret not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-nowpayments-sig");

    if (!isValidSignature(rawBody, signature, ipnSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = parsePayload(rawBody);
    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType =
      asString(payload.event_type) ?? asString(payload.event) ?? asString(payload.status)?.toLowerCase();
    if (!eventType) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    if (eventType === "subscription_created") {
      const customerId = asString(payload.order_id);
      if (customerId) {
        await prisma.user.updateMany({
          where: { id: customerId },
          data: { subscriptionStatus: "pending" },
        });
      }
    } else if (eventType === "subscription_activated" || eventType === "subscription_paid") {
      const customerId = asString(payload.order_id);
      const planId = asNumber(payload.subscription_plan_id) ?? asNumber(payload.plan_id);
      const subscriptionId = asString(payload.subscription_id);
      const subscriptionExpiresAt = parseExpirationDate(payload);

      if (!customerId || !planId || !subscriptionId || !subscriptionExpiresAt) {
        return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
      }

      const plan = resolveSubscriptionPlan(planId);
      const now = new Date();

      await prisma.user.updateMany({
        where: { id: customerId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionExpiresAt,
          payproSubscriptionId: subscriptionId,
          checksUsedThisMonth: 0,
          monthlyResetDate: now,
        },
      });
    } else if (eventType === "subscription_canceled" || eventType === "subscription_expired") {
      const customerId = asString(payload.order_id);
      if (customerId) {
        await prisma.user.updateMany({
          where: { id: customerId },
          data: { subscriptionStatus: "inactive" },
        });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("NOWPayments webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
