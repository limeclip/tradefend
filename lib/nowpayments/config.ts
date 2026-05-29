export function getNowPaymentsApiBase(): string {
  return process.env.NOWPAYMENTS_MODE === "live"
    ? "https://api.nowpayments.io/v1"
    : "https://api-sandbox.nowpayments.io/v1";
}
