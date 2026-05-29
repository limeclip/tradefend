import { NextResponse } from "next/server";

import { getNowPaymentsAuthToken } from "@/lib/nowpayments/auth";
import { getNowPaymentsApiBase } from "@/lib/nowpayments/config";
import {
  getNowPaymentsPlanId,
  parsePlanId,
  SUBSCRIPTION_PLANS,
} from "@/lib/nowpayments/subscriptions";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type CreateSubscriptionResult = {
  id?: number | string;
};

type CreateSubscriptionResponse = {
  result?: CreateSubscriptionResult[];
};

function extractSubscriptionId(payload: CreateSubscriptionResponse | null): string | null {
  const first = payload?.result?.[0];
  if (first?.id === undefined || first.id === null) {
    return null;
  }
  return String(first.id);
}

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "NOWPayments env not configured" }, { status: 500 });
    }

    const token = await getNowPaymentsAuthToken(apiKey);
    if (!token) {
      return NextResponse.json({ error: "NOWPayments authentication failed" }, { status: 500 });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    const subscriptionPlanId = getNowPaymentsPlanId(planId);

    const createRes = await fetch(`${getNowPaymentsApiBase()}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription_plan_id: subscriptionPlanId,
        email: user.email,
      }),
    });

    const createPayload = (await createRes.json().catch(() => null)) as CreateSubscriptionResponse | null;
    const subscriptionId = extractSubscriptionId(createPayload);

    if (!createRes.ok || !subscriptionId) {
      console.error("NOWPayments subscription creation failed", {
        status: createRes.status,
        payload: createPayload,
      });
      return NextResponse.json({ error: "Could not create subscription" }, { status: 502 });
    }

    await prisma.payProOrder.create({
      data: {
        orderId: subscriptionId,
        userId: dbUser.id,
        planId,
        amountUsd: selectedPlan.amount,
        currency: "USD",
        status: "pending",
      },
    });

    return NextResponse.json({ requiresEmailCheck: true, subscriptionId }, { status: 200 });
  } catch (error) {
    console.error("Create NOWPayments subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
