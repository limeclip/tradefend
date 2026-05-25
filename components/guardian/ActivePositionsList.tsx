'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { ActivePositionCard } from '@/components/guardian/ActivePositionCard';
import { GUARDIAN_CARD_GRID } from '@/components/guardian/guardian-grid';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserPositionRow } from '@/lib/guardian/types';

type Props = {
  refreshKey?: number;
};

export function ActivePositionsList({ refreshKey = 0 }: Props) {
  const [positions, setPositions] = React.useState<UserPositionRow[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [closingId, setClosingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guardian/positions', { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as { positions?: UserPositionRow[] } | null;
      setPositions(res.ok && json?.positions ? json.positions : []);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function closePosition(id: string) {
    setClosingId(id);
    try {
      const res = await fetch(`/api/guardian/positions/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Could not close position');
        return;
      }
      toast.success('Position closed');
      await load();
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setClosingId(null);
    }
  }

  if (loading) {
    return (
      <section className={GUARDIAN_CARD_GRID}>
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </section>
    );
  }

  if (!positions?.length) {
    return (
      <Card className="rounded-xl ring-foreground/10 dark:ring-border/50 bg-card dark:bg-[#1c1c1c]  p-10 text-center shadow-none">
        <p className="text-base font-semibold text-foreground">No active positions</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Open a position from a saved plan or after building a safe plan.
        </p>
      </Card>
    );
  }

  return (
    <ul className={`${GUARDIAN_CARD_GRID} list-none p-0`}>
      {positions.map((pos) => (
        <li key={pos.id} className="min-h-[220px]">
          <ActivePositionCard
            position={pos}
            closing={closingId === pos.id}
            onClose={() => void closePosition(pos.id)}
          />
        </li>
      ))}
    </ul>
  );
}
