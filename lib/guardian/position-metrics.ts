/** Price / P&L / SL–TP distance helpers for position cards. */

export type PositionLiveMetrics = {
  currentPrice: number | null;
  pnlPercent: number | null;
  pnlUsd: number | null;
  percentToSl: number | null;
  percentToTp: number | null;
  /** 0 = at stop loss, 100 = at take profit (clamped). */
  slTpProgress: number | null;
};

export function computePositionLiveMetrics(params: {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  currentPrice: number | null;
  positionSizeUsdt: number | null;
}): PositionLiveMetrics {
  const { entryPrice, stopLossPrice, takeProfitPrice, currentPrice, positionSizeUsdt } = params;

  if (currentPrice === null || !Number.isFinite(currentPrice) || currentPrice <= 0) {
    return {
      currentPrice: null,
      pnlPercent: null,
      pnlUsd: null,
      percentToSl: null,
      percentToTp: null,
      slTpProgress: null,
    };
  }

  const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  const pnlUsd =
    positionSizeUsdt !== null && positionSizeUsdt > 0
      ? (positionSizeUsdt * pnlPercent) / 100
      : null;

  const percentToSl = ((currentPrice - stopLossPrice) / currentPrice) * 100;
  const percentToTp = ((takeProfitPrice - currentPrice) / currentPrice) * 100;

  const range = takeProfitPrice - stopLossPrice;
  const slTpProgress =
    range > 0 ? Math.max(0, Math.min(100, ((currentPrice - stopLossPrice) / range) * 100)) : null;

  return {
    currentPrice,
    pnlPercent,
    pnlUsd,
    percentToSl,
    percentToTp,
    slTpProgress,
  };
}

export function formatUsd(value: number, maxFractionDigits = 2): string {
  if (value >= 1) {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: maxFractionDigits,
    });
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
