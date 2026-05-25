/** Derive stop-loss price from entry and percent below entry. */
export function stopLossPriceFromPercent(entryPrice: number, stopLossPercent: number): number {
  return entryPrice * (1 - stopLossPercent / 100);
}

/** Derive take-profit price from entry and percent above entry. */
export function takeProfitPriceFromPercent(entryPrice: number, takeProfitPercent: number): number {
  return entryPrice * (1 + takeProfitPercent / 100);
}

/** Small tolerance for price-level triggers (fraction of price). */
export const PRICE_TRIGGER_TOLERANCE = 0.005;

export function isPriceAtOrBelow(current: number, target: number): boolean {
  return current <= target * (1 + PRICE_TRIGGER_TOLERANCE);
}

export function isPriceAtOrAbove(current: number, target: number): boolean {
  return current >= target * (1 - PRICE_TRIGGER_TOLERANCE);
}
