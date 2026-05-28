import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type NowPaymentsWebhookPayload = {
  event_type?: unknown;
  event?: unknown;
  customer_id?: unknown;
  plan_id?: unknown;
  subscription_id?: unknown;
  next_payment_date?: unknown;
  expiration_date?: unknown;
};

function parsePayload(raw: string): NowPaymentsWebhookPayload | null {
  try {
    return JSON.parse(raw) as NowPaymentsWebhookPayload;
  } catch {
    return null;
  }
}

function isValidSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
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

function resolvePlan(nowPlanId: number): "pro_monthly" | "pro_yearly" {
  return nowPlanId === 1535298971 ? "pro_monthly" : "pro_yearly";
}

function parseExpirationDate(payload: NowPaymentsWebhookPayload): Date | null {
  const dateValue =
    (typeof payload.next_payment_date === "string" ? payload.next_payment_date : null) ??
    (typeof payload.expiration_date === "string" ? payload.expiration_date : null);

  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

    const eventType = asString(payload.event_type) ?? asString(payload.event);
    if (!eventType) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    if (eventType === "subscription_activated" || eventType === "subscription_paid") {
      const customerId = asString(payload.customer_id);
      const planId = asNumber(payload.plan_id);
      const subscriptionId = asString(payload.subscription_id);
      const subscriptionExpiresAt = parseExpirationDate(payload);

      if (!customerId || !planId || !subscriptionId || !subscriptionExpiresAt) {
        return NextResponse.json({ error: "Missing required subscription fields" }, { status: 400 });
      }

      await prisma.user.updateMany({
        where: { id: customerId },
        data: {
          subscriptionPlan: resolvePlan(planId),
          subscriptionStatus: "active",
          subscriptionExpiresAt,
          payproSubscriptionId: subscriptionId,
          checksUsedThisMonth: 0,
          monthlyResetDate: new Date(),
        },
      });
    } else if (eventType === "subscription_canceled" || eventType === "subscription_expired") {
      const customerId = asString(payload.customer_id);
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
