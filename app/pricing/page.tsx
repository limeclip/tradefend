'use client';

import * as React from 'react';
import { Check, CheckCircle2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FREE_PLAN_FEATURES, PRO_PLAN_FEATURES, type PricingFeature } from '@/lib/pricing/plans';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type PlanId = 'monthly' | 'yearly';

type PlanCard = {
  id: PlanId | 'free';
  title: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  features: PricingFeature[];
  cta: string;
  highlight?: boolean;
};

const plans: PlanCard[] = [
  {
    id: 'free',
    title: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Start with core risk checks and a focused workflow.',
    features: FREE_PLAN_FEATURES,
    cta: 'Get started free',
  },
  {
    id: 'monthly',
    title: 'Pro Monthly',
    price: '$12.99',
    period: '/month',
    description: 'Full power for active traders who check markets daily.',
    features: PRO_PLAN_FEATURES,
    cta: 'Subscribe monthly',
    highlight: true,
  },
  {
    id: 'yearly',
    title: 'Pro Yearly',
    price: '$99',
    period: '/year',
    description: 'Best value — same Pro features with yearly billing.',
    badge: 'Best value',
    features: PRO_PLAN_FEATURES,
    cta: 'Subscribe yearly',
  },
];

function FeatureList({ features }: { features: PricingFeature[] }) {
  return (
    <ul className="space-y-2.5">
      {features.map((feature) => (
        <li key={feature.label} className="flex items-start gap-2.5 text-sm">
          {feature.included ? (
            <Check className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={2} />
          ) : (
            <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" strokeWidth={2} />
          )}
          <span className={cn(feature.included ? 'text-foreground' : 'text-muted-foreground')}>
            {feature.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = React.useState<PlanId | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = React.useState(false);
  const [hasSession, setHasSession] = React.useState(false);
  const [currentPlan, setCurrentPlan] = React.useState<PlanId | 'free' | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setHasSession(Boolean(user));
        setAuthLoaded(true);

        if (!user) {
          setCurrentPlan(null);
          return;
        }

        const subRes = await fetch('/api/subscription/status', { method: 'GET', cache: 'no-store' });
        const subJson = (await subRes.json().catch(() => null)) as
          | { plan?: string; subscriptionStatus?: string }
          | null;
        if (cancelled) return;
        const isActive = subJson?.subscriptionStatus === 'active';
        if (!isActive) {
          setCurrentPlan('free');
          return;
        }
        if (subJson?.plan === 'pro_monthly') {
          setCurrentPlan('monthly');
        } else if (subJson?.plan === 'pro_yearly') {
          setCurrentPlan('yearly');
        } else {
          setCurrentPlan('free');
        }
      } catch {
        if (!cancelled) {
          setAuthLoaded(true);
          setCurrentPlan(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function subscribe(planId: PlanId) {
    setError(null);

    if (!authLoaded) return;

    if (!hasSession) {
      router.push('/login?redirect=/pricing');
      return;
    }

    if (currentPlan === planId) return;

    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/paypro/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const json = (await res.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!res.ok || !json?.checkoutUrl) {
        setError(json?.error ?? 'Could not start checkout.');
        return;
      }

      window.location.href = json.checkoutUrl;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  }

  function handleFreeCta() {
    if (!authLoaded) return;
    if (hasSession) {
      router.push('/dashboard');
      return;
    }
    router.push('/register');
  }

  return (
    <div className='min-h-screen bg-sidebar'>
      <Header />
      <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10 md:px-10">
        <header className="space-y-4 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">PreTrade Pricing</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Simple plans, serious edge.</h1>
          <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Upgrade to Pro for higher limits and a smoother research workflow. Free stays useful — Pro removes friction.
          </p>
          <ul className="mx-auto flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-sm text-foreground">
            {['Risk checks', 'Watchlist', 'Guardian', 'Shareable reports'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </header>

        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent =
              plan.id === 'free' ? currentPlan === 'free' : currentPlan === plan.id;
            const isProCard = plan.id !== 'free';

            return (
              <Card
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-3xl border-border/80 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]',
                  plan.highlight && 'ring-2 ring-foreground/10',
                )}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl tracking-tight">{plan.title}</CardTitle>
                    {plan.badge ? (
                      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-end gap-1">
                    <p className="text-5xl font-semibold tracking-tight text-foreground">{plan.price}</p>
                    <p className="pb-1 text-sm text-muted-foreground">{plan.period}</p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6">
                  <FeatureList features={plan.features} />
                  <Button
                    className="mt-auto h-12 w-full rounded-2xl cursor-pointer"
                    variant={isCurrent ? 'secondary' : plan.highlight ? 'default' : 'outline'}
                    disabled={
                      (isProCard && (loadingPlan === plan.id || isCurrent)) ||
                      (!isProCard && !authLoaded)
                    }
                    onClick={() => {
                      if (plan.id === 'free') {
                        handleFreeCta();
                        return;
                      }
                      void subscribe(plan.id);
                    }}
                  >
                    {isCurrent
                      ? 'Current plan'
                      : isProCard && loadingPlan === plan.id
                        ? 'Redirecting…'
                        : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>
      <Footer/>
    </div>
  );
}
