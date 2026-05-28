import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS, parsePlanId } from "@/lib/nowpayments/subscriptions";
import { createClient } from "@/lib/supabase/server";

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
    if (!nowPaymentsApiKey) {
      console.error("Missing NOWPayments config", {
        hasApiKey: Boolean(nowPaymentsApiKey),
      });
      return NextResponse.json({ error: "NOWPayments is not configured" }, { status: 500 });
    }

    const configuredPlan = SUBSCRIPTION_PLANS[planId];
    const nowPlanId = configuredPlan.envPlanId ?? configuredPlan.fallbackPlanId;

    if (!nowPlanId) {
      return NextResponse.json({ error: "Subscription plan is not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.nowpayments.io/v1/subscriptions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": nowPaymentsApiKey,
      },
      body: JSON.stringify({
        subscription_plan_id: nowPlanId,
        email: user.email,
        order_id: dbUser.id,
      }),
    });

    const payload = await response.json().catch(() => null);

    // Пробуем извлечь paymentUrl из разных вариантов ответа
    let paymentUrl: string | null = null;
    if (payload) {
      if (typeof payload.invoice_url === "string") paymentUrl = payload.invoice_url;
      else if (typeof payload.invoiceUrl === "string") paymentUrl = payload.invoiceUrl;
      else if (payload.data && typeof payload.data.invoice_url === "string") paymentUrl = payload.data.invoice_url;
      else if (payload.data && typeof payload.data.invoiceUrl === "string") paymentUrl = payload.data.invoiceUrl;
    }

    if (!response.ok || !paymentUrl) {
      console.error("NOWPayments subscription creation failed", {
        status: response.status,
        payload,
      });
      return NextResponse.json({ error: "Could not create subscription" }, { status: 502 });
    }

    return NextResponse.json({ paymentUrl }, { status: 200 });
  } catch (error) {
    console.error("Create NOWPayments subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}