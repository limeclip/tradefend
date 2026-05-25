'use client';

import { toast } from 'sonner';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { buildOpenPositionFromPlan } from '@/lib/guardian/open-position';
import type { PositionPlanRow } from '@/lib/guardian/types';

type Props = {
  plan: PositionPlanRow | null;
  open: boolean;
  hasOpenPosition?: boolean;
  onClose: () => void;
  onOpened?: () => void;
};

export function PositionPlanDetailModal({
  plan,
  open,
  hasOpenPosition = false,
  onClose,
  onOpened,
}: Props) {
  if (!plan) return null;

  const activePlan = plan;

  async function handleOpenPosition() {
    if (hasOpenPosition) return;

    try {
      const res = await fetch('/api/guardian/positions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildOpenPositionFromPlan(activePlan)),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;

      if (res.status === 403) {
        toast.error(json?.error ?? 'Open position limit reached.');
        return;
      }
      if (!res.ok) {
        toast.error(json?.error ?? 'Could not open position');
        return;
      }

      toast.success('Position opened');
      onClose();
      onOpened?.();
    } catch {
      toast.error('Network error. Try again.');
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={activePlan.ticker ?? activePlan.tokenAddress.slice(0, 12)}
      className="max-w-lg"
    >
      <section className="space-y-6 p-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Size" value={`${activePlan.positionSizePercent}%`} />
          <Metric label="Stop loss" value={`${activePlan.stopLossPercent}%`} />
          <Metric label="Take profit" value={`${activePlan.takeProfitPercent}%`} />
        </section>
        <section className="rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/90">
          {activePlan.aiSummary}
        </section>
        <section className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-11 flex-1 rounded-2xl cursor-pointer"
            disabled={hasOpenPosition}
            onClick={() => void handleOpenPosition()}
          >
            {hasOpenPosition ? 'Opened' : 'Open Position'}
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-2xl cursor-pointer" onClick={onClose}>
            Close
          </Button>
        </section>
      </section>
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </section>
  );
}
