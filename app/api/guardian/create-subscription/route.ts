import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type PlanId = "monthly" | "yearly";

type NowPaymentsPlanConfig = {
  nowPlanId: number;
};

const PLAN_CONFIG: Record<PlanId, NowPaymentsPlanConfig> = {
  monthly: { nowPlanId: 1535298971 },
  yearly: { nowPlanId: 856620025 },
};

function parsePlanId(value: unknown): PlanId | null {
  return value === "monthly" || value === "yearly" ? value : null;
}

type CreateSubscriptionResponse = {
  invoice_url?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { planId?: unknown } | null;
    const planId = parsePlanId(body?.planId);

    if (!planId) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const nowPaymentsApiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (!nowPaymentsApiKey || !appUrl) {
      console.error("Missing NOWPayments config", {
        hasApiKey: Boolean(nowPaymentsApiKey),
        hasAppUrl: Boolean(appUrl),
      });
      return NextResponse.json({ error: "NOWPayments is not configured" }, { status: 500 });
    }

    const nowPlanId = PLAN_CONFIG[planId].nowPlanId;

    const response = await fetch("https://api.nowpayments.io/v1/subscription", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": nowPaymentsApiKey,
      },
      body: JSON.stringify({
        plan_id: nowPlanId,
        customer_email: user.email,
        customer_id: dbUser.id,
        redirect_url: `${appUrl}/payment-status`,
        webhook_url: `${appUrl}/api/webhooks/nowpayments`,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | CreateSubscriptionResponse
      | { message?: string }
      | null;

    if (!response.ok || !payload || typeof payload.invoice_url !== "string" || !payload.invoice_url.trim()) {
      console.error("NOWPayments subscription creation failed", {
        status: response.status,
        payload,
      });
      return NextResponse.json({ error: "Could not create subscription" }, { status: 502 });
    }

    return NextResponse.json({ paymentUrl: payload.invoice_url }, { status: 200 });
  } catch (error) {
    console.error("Create NOWPayments subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
