import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

console.log("Webhook route module loaded");

function safeEquals(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(left), Buffer.from(right));
  } catch {
    return false;
  }
}

function verifyHash(orderId: string, hash: string, apiSecretKey: string, testMode: string): boolean {
  const expected =
    testMode === "1"
      ? createHash("md5").update("1").digest("hex")
      : createHash("md5").update(`${orderId}${apiSecretKey}`).digest("hex");
  return safeEquals(hash, expected);
}

function verifySignature(
  orderId: string,
  orderStatus: string,
  orderTotalAmount: string,
  customerEmail: string,
  validationKey: string,
  testMode: string,
  ipnTypeName: string,
  signature: string,
): boolean {
  const base = `${orderId}${orderStatus}${orderTotalAmount}${customerEmail}${validationKey}${testMode}${ipnTypeName}`;
  const expected = createHash("sha256").update(base).digest("hex");
  return safeEquals(signature, expected);
}

function parsePlanFromProduct(productId: string): "pro_monthly" | "pro_yearly" | null {
  const monthly = process.env.PAYPRO_PRODUCT_ID_MONTHLY?.trim();
  const yearly = process.env.PAYPRO_PRODUCT_ID_YEARLY?.trim();
  const normalized = productId.trim();
  if (monthly && normalized === monthly) return "pro_monthly";
  if (yearly && normalized === yearly) return "pro_yearly";
  return null;
}

function getCustomUserId(form: URLSearchParams): string | null {
  const direct = form.get("CUSTOM") ?? form.get("custom");
  if (direct?.trim()) return direct.trim();

  const checkoutQuery = form.get("CHECKOUT_QUERY_STRING");
  if (checkoutQuery?.trim()) {
    const qs = new URLSearchParams(checkoutQuery);
    const fromQuery = qs.get("custom");
    if (fromQuery?.trim()) return fromQuery.trim();
  }

  const orderCustomFields = form.get("ORDER_CUSTOM_FIELDS");
  if (orderCustomFields?.trim()) {
    const raw = orderCustomFields.trim();
    try {
      const json = JSON.parse(raw) as Record<string, unknown>;
      const value = json.custom;
      if (typeof value === "string" && value.trim()) return value.trim();
    } catch {
      const fields = new URLSearchParams(raw);
      const value = fields.get("custom");
      if (value?.trim()) return value.trim();
    }
  }
  return null;
}

function isActivationEvent(ipnTypeName: string): boolean {
  return ipnTypeName === "OrderCharged" || ipnTypeName === "SubscriptionChargeSucceed" || ipnTypeName === "SubscriptionRenewed";
}

function isDeactivationEvent(ipnTypeName: string): boolean {
  return (
    ipnTypeName === "SubscriptionSuspended" ||
    ipnTypeName === "SubscriptionTerminated" ||
    ipnTypeName === "SubscriptionFinished" ||
    ipnTypeName === "OrderRefunded" ||
    ipnTypeName === "OrderChargedBack"
  );
}

export async function POST(request: Request) {
  try {
    console.log("Webhook POST called");

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    const rawBody = await request.text();
    const form = new URLSearchParams(rawBody);

    const validationKey = process.env.PAYPRO_VALIDATION_KEY;
    const apiSecretKey = process.env.PAYPRO_API_SECRET_KEY;
    if (!validationKey) {
      console.error("PAYPRO_VALIDATION_KEY not configured");
      return NextResponse.json({ error: "Webhook validation key missing" }, { status: 500 });
    }
    if (!apiSecretKey) {
      console.error("PAYPRO_API_SECRET_KEY not configured");
      return NextResponse.json({ error: "Webhook api secret missing" }, { status: 500 });
    }

    const orderId = form.get("ORDER_ID")?.trim() ?? "";
    const orderStatus = form.get("ORDER_STATUS")?.trim() ?? "";
    const orderTotalAmount = form.get("ORDER_TOTAL_AMOUNT")?.trim() ?? "";
    const customerEmail = form.get("CUSTOMER_EMAIL")?.trim() ?? "";
    const ipnTypeName = form.get("IPN_TYPE_NAME")?.trim() ?? "";
    const signature = form.get("SIGNATURE")?.trim() ?? "";
    const hash = form.get("HASH")?.trim() ?? "";
    const testMode = form.get("TEST_MODE")?.trim() || "0";

    if (!orderId || !orderStatus || !orderTotalAmount || !customerEmail || !ipnTypeName || !signature || !hash) {
      return NextResponse.json({ error: "Missing required IPN fields" }, { status: 400 });
    }

    if (!verifyHash(orderId, hash, apiSecretKey, testMode)) {
      console.warn("Invalid PayPro HASH");
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }
    if (
      !verifySignature(orderId, orderStatus, orderTotalAmount, customerEmail, validationKey, testMode, ipnTypeName, signature)
    ) {
      console.warn("Invalid PayPro SIGNATURE");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const userIdFromCustom = getCustomUserId(form);
    let user: { id: string } | null = null;
    let userFoundBy: "id" | "supabaseUserId" | "email" | null = null;

    if (userIdFromCustom) {
      user = await prisma.user.findUnique({
        where: { id: userIdFromCustom },
        select: { id: true },
      });
      if (user) {
        userFoundBy = "id";
      } else {
        user = await prisma.user.findUnique({
          where: { supabaseUserId: userIdFromCustom },
          select: { id: true },
        });
        if (user) {
          userFoundBy = "supabaseUserId";
        }
      }
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true },
      });
      if (user) {
        userFoundBy = "email";
      }
    }

    console.log("PayPro webhook user lookup result", {
      userIdFromCustom,
      customerEmail,
      foundUserId: user?.id ?? null,
      foundBy: userFoundBy,
    });

    if (!user) {
      console.warn("PayPro webhook user not found", {
        orderId,
        customerEmail,
        userIdFromCustom,
      });
      return NextResponse.json({ ok: true, ignored: "User not found" }, { status: 200 });
    }

    const plan = parsePlanFromProduct(form.get("PRODUCT_ID") ?? "");
    const now = new Date();
    const subscriptionFinishDate = form.get("SUBSCRIPTION_FINISH_DATE");
    const subscriptionExpiresAt = subscriptionFinishDate ? new Date(subscriptionFinishDate) : null;
    const subscriptionId = form.get("SUBSCRIPTION_ID")?.trim() ?? null;
    const customerId = form.get("CUSTOMER_ID")?.trim() ?? null;

    if (isActivationEvent(ipnTypeName)) {
      await prisma.$transaction([
        prisma.payProOrder.upsert({
          where: { orderId },
          create: {
            orderId,
            userId: user.id,
            planId: plan ?? "unknown",
            amountUsd: orderTotalAmount || "0",
            currency: form.get("ORDER_CURRENCY_CODE")?.trim() || "USD",
            status: "paid",
            payproCustomerId: customerId,
          },
          update: {
            status: "paid",
            payproCustomerId: customerId,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "active",
            subscriptionPlan: plan ?? undefined,
            subscriptionExpiresAt: subscriptionExpiresAt ?? undefined,
            payproSubscriptionId: subscriptionId ?? undefined,
            checksUsedThisMonth: 0,
            monthlyResetDate: now,
          },
        }),
      ]);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (isDeactivationEvent(ipnTypeName)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "inactive",
          subscriptionExpiresAt: subscriptionExpiresAt ?? undefined,
          payproSubscriptionId: subscriptionId ?? undefined,
        },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}