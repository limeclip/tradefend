import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS, parsePlanId } from "@/lib/nowpayments/subscriptions";
import { createClient } from "@/lib/supabase/server";

type AuthResponse = { token?: string };

async function getNowPaymentsToken(apiKey: string, email: string, password: string): Promise<string> {
  const res = await fetch("https://api.nowpayments.io/v1/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ email, password }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.token) {
    throw new Error(`NOWPayments auth failed (${res.status})`);
  }
  return payload.token;
}

function extractPaymentUrl(payload: any): string | null {
  if (!payload) return null;
  if (typeof payload.invoice_url === "string") return payload.invoice_url;
  if (payload.data?.invoice_url) return payload.data.invoice_url;
  if (Array.isArray(payload.result) && payload.result[0]?.invoice_url) return payload.result[0].invoice_url;
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
    const npEmail = process.env.NOWPAYMENTS_EMAIL?.trim();
    const npPassword = process.env.NOWPAYMENTS_PASSWORD?.trim();
    if (!apiKey || !npEmail || !npPassword) {
      return NextResponse.json({ error: "NOWPayments env not configured" }, { status: 500 });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planId];
    const nowPlanId = selectedPlan.envPlanId ?? selectedPlan.fallbackPlanId;
    if (!nowPlanId) {
      return NextResponse.json({ error: "NOWPayments plan id not configured" }, { status: 500 });
    }

    const token = await getNowPaymentsToken(apiKey, npEmail, npPassword);

    // Важно: отправляем и Authorization Bearer, и x-api-key
    const response = await fetch("https://api.nowpayments.io/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        subscription_plan_id: nowPlanId,
        email: user.email,
      }),
    });

    const payload = await response.json().catch(() => null);
    const paymentUrl = extractPaymentUrl(payload);

    if (!response.ok || !paymentUrl) {
      let userMessage = "Could not create subscription. Please try again later.";
      if (payload?.message?.includes("already subscribed")) {
        userMessage = "You already have a pending or active subscription for this plan. Please check your email for the payment link.";
      } else if (payload?.message) {
        userMessage = payload.message;
      }
      console.error("NOWPayments subscription creation failed", { status: response.status, payload });
      return NextResponse.json({ error: userMessage }, { status: 502 });
    }

    return NextResponse.json({ paymentUrl }, { status: 200 });
  } catch (error) {
    console.error("Create NOWPayments subscription error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}