import { NextResponse } from "next/server";

import { SUBSCRIPTION_PLANS } from "@/lib/nowpayments/subscriptions";
import { createClient } from "@/lib/supabase/server";

type CreatePlanResponse = {
  id?: number;
  title?: string;
  interval_day?: number;
  amount?: string | number;
  currency?: string;
};

function isCreatePlanResponse(value: unknown): value is CreatePlanResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  return "id" in value;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (!apiKey || !appUrl) {
      return NextResponse.json({ error: "NOWPayments is not configured" }, { status: 500 });
    }

    const createdPlans: Array<{ localPlan: "monthly" | "yearly"; remotePlanId: number }> = [];

    for (const [localPlan, config] of Object.entries(SUBSCRIPTION_PLANS) as Array<
      [keyof typeof SUBSCRIPTION_PLANS, (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS]]
    >) {
      const response = await fetch("https://api.nowpayments.io/v1/subscriptions/plans", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          title: config.title,
          interval_day: config.intervalDay,
          amount: config.amount,
          currency: config.currency,
          ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
          success_url: `${appUrl}/payment-status`,
          cancel_url: `${appUrl}/pricing?status=cancelled`,
          partially_paid_url: `${appUrl}/payment-status?status=partially_paid`,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok || !isCreatePlanResponse(payload) || typeof payload.id !== "number") {
        return NextResponse.json(
          {
            error: `Could not create ${localPlan} plan`,
            status: response.status,
            details: payload,
          },
          { status: 502 },
        );
      }

      createdPlans.push({ localPlan, remotePlanId: payload.id });
    }

    return NextResponse.json({ plans: createdPlans }, { status: 200 });
  } catch (error) {
    console.error("Create NOWPayments plans error:", error);
    return NextResponse.json({ error: "Failed to create plans" }, { status: 500 });
  }
}
