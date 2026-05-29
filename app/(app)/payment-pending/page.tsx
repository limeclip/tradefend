'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Suspense } from 'react';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type SubscriptionStatusResponse = {
  subscriptionStatus?: string;
};

function PaymentPendingSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Skeleton className="h-80 w-full max-w-lg rounded-3xl" />
    </div>
  );
}

function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('subscriptionId');

  const [checking, setChecking] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handlePaidClick() {
    setMessage(null);
    setChecking(true);
    try {
      const res = await fetch('/api/subscription/status', { method: 'GET', cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as SubscriptionStatusResponse | null;

      if (res.ok && json?.subscriptionStatus === 'active') {
        router.push('/dashboard');
        return;
      }

      setMessage('Payment not yet confirmed. Please wait or check your email.');
    } catch {
      setMessage('Payment not yet confirmed. Please wait or check your email.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-3xl border-border/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-muted/40">
            <Mail className="size-7 text-foreground" strokeWidth={1.5} />
          </div>
          <CardTitle className="text-2xl tracking-tight">Payment link sent</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            We&apos;ve sent a payment link to your email address. Check your inbox (including spam
            folder). Click the link to complete your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-sm text-muted-foreground">
            The payment link is valid for 7 days. After payment, your Pro access will activate
            automatically.
          </p>

          {subscriptionId ? (
            <p className="text-center text-xs text-muted-foreground">
              Subscription ID: <span className="font-mono text-foreground">{subscriptionId}</span>
            </p>
          ) : null}

          {message ? (
            <p className="text-center text-sm text-muted-foreground" role="status">
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button
              className="h-12 w-full rounded-2xl"
              onClick={() => void handlePaidClick()}
              disabled={checking}
            >
              {checking ? 'Checking…' : "I've paid"}
            </Button>
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="h-12 w-full rounded-2xl">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<PaymentPendingSkeleton />}>
      <PaymentPendingContent />
    </Suspense>
  );
}
