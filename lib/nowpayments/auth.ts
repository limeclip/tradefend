import { getNowPaymentsApiBase } from "@/lib/nowpayments/config";

type AuthResponse = {
  token?: string;
};

export async function getNowPaymentsAuthToken(apiKey: string): Promise<string | null> {
  const email = process.env.NOWPAYMENTS_EMAIL?.trim();
  const password = process.env.NOWPAYMENTS_PASSWORD?.trim();
  if (!email || !password) {
    return null;
  }

  const response = await fetch(`${getNowPaymentsApiBase()}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json().catch(() => null)) as AuthResponse | null;
  if (!response.ok || !payload?.token) {
    console.error("NOWPayments auth failed", { status: response.status, payload });
    return null;
  }

  return payload.token;
}
