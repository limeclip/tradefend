import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PlanId = "monthly" | "yearly";
const PLAN_CONFIG: Record<PlanId, { productIdEnv: "PAYPRO_PRODUCT_ID_MONTHLY" | "PAYPRO_PRODUCT_ID_YEARLY" }> = {
  monthly: { productIdEnv: "PAYPRO_PRODUCT_ID_MONTHLY" },
  yearly: { productIdEnv: "PAYPRO_PRODUCT_ID_YEARLY" },
};

function parsePlanId(value: unknown): PlanId | null {
  return value === "monthly" || value === "yearly" ? value : null;
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

    const apiSecretKey = process.env.PAYPRO_API_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const productId = process.env[PLAN_CONFIG[planId].productIdEnv]?.trim();

    if (!apiSecretKey || !appUrl || !productId) {
      console.error("Missing PayPro config", { apiSecretKey: !!apiSecretKey, appUrl, productId });
      return NextResponse.json({ error: "Missing PayPro config" }, { status: 500 });
    }
    if (!user.email) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    const checkoutUrl = new URL("https://store.payproglobal.com/checkout");
    const params = checkoutUrl.searchParams;

    params.set(`products[${productId}][id]`, productId);
    params.set(`products[${productId}][quantity]`, "1");
    params.set("customer_email", user.email);
    params.set("custom", user.id);
    params.set("currency", "USD");
    params.set("language", "en");

    const appHost = new URL(appUrl).hostname.toLowerCase();
    const shouldUseTestMode =
      appHost === "localhost" || appHost === "127.0.0.1" || appHost.includes("ngrok");

    if (shouldUseTestMode) {
      params.set("use-test-mode", "true");
      params.set("secret-key", apiSecretKey);
    }

    // URL для редиректа после оплаты
    params.set("return_url", `${appUrl}/payment-status?status=success`);
    params.set("cancel_url", `${appUrl}/pricing?status=cancelled`);
    // ✅ возвращаем paymentUrl – именно его ждёт pricing/page.tsx
    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}