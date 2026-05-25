import { Card, CardContent } from '@/components/ui/card';
import {
  formatMarketPriceUsd,
  formatMarketUsdAmount,
  type TokenMarketData,
} from '@/lib/token-cache/market-data';

type TokenKeyMetricsProps = {
  marketData: TokenMarketData;
};

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50   bg-background dark:bg-[#1c1c1c] py-0 shadow-sm">
      <CardContent className="px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export function TokenKeyMetrics({ marketData }: TokenKeyMetricsProps) {
  const { priceUsd, liquidityUsd, volume24hUsd, pairsCount } = marketData;

  if (priceUsd <= 0 && liquidityUsd <= 0 && volume24hUsd <= 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Key metrics
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Price" value={formatMarketPriceUsd(priceUsd)} />
        <MetricCard label="Liquidity" value={formatMarketUsdAmount(liquidityUsd)} />
        <MetricCard label="24h volume" value={formatMarketUsdAmount(volume24hUsd)} />
        {pairsCount > 0 ? (
          <MetricCard label="Pairs" value={pairsCount.toLocaleString('en-US')} />
        ) : null}
      </div>
    </section>
  );
}
