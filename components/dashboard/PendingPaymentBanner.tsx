'use client';

import Link from 'next/link';
import * as React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

type PendingResponse = {
  hasPending: boolean;
  subscriptionId?: string;
};

export function PendingPaymentBanner() {
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState<PendingResponse | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/guardian/pending-subscription', {
          method: 'GET',
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => null)) as PendingResponse | null;
        if (!cancelled && res.ok && json) {
          setPending(json);
        }
      } catch {
        if (!cancelled) {
          setPending(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <Skeleton className="h-16 w-full rounded-2xl max-w-5xl" />;
  }

  if (!pending?.hasPending || !pending.subscriptionId) {
    return null;
  }

  return (
    <Alert className="border-amber-500/30 bg-amber-500/5 max-w-5xl">
      <AlertTitle>Unpaid subscription</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>You have an unpaid subscription. Complete payment to activate Pro.</span>
        <Link
          href={`/payment-pending?subscriptionId=${encodeURIComponent(pending.subscriptionId)}`}
          className="shrink-0 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Complete payment
        </Link>
      </AlertDescription>
    </Alert>
  );
}
