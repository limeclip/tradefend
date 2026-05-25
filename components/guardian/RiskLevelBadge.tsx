import { Badge } from '@/components/ui/badge';
import { riskBadgeClass } from '@/lib/watchlist/risk-styles';
import { cn } from '@/lib/utils';

type Props = {
  level: string | null | undefined;
  className?: string;
};

export function RiskLevelBadge({ level, className }: Props) {
  const label = level?.toUpperCase() ?? '—';
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full border-0 px-2 py-0.5 text-[11px] font-medium', riskBadgeClass(level), className)}
    >
      {label === '—' ? 'Unknown' : label}
    </Badge>
  );
}
