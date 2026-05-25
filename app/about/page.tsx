import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Eye,
  GitCompareArrows,
  ListChecks,
  SearchCheck,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'About Tradefend | Pre-Trade Risk Checker',
  description:
    'Tradefend helps traders analyze risk before every trade — from pre-trade checks and watchlists to position guardian tools and shareable reports.',
};

const features = [
  {
    title: 'Risk Checker',
    description:
      'Pre-trade analysis for any ticker or contract address. Liquidity, concentration, volatility, contract security, and AI guidance in one calm report.',
    icon: SearchCheck,
  },
  {
    title: 'Smart Watchlist + alerts',
    description:
      'Track tokens you care about. Automatic re-checks and notifications when risk levels change — so you are not surprised after entry.',
    icon: Bell,
  },
  {
    title: 'Token Comparison Tool',
    description:
      'Compare 2–5 tokens side by side on the metrics that matter. Pick the cleaner setup before you commit capital.',
    icon: GitCompareArrows,
  },
  {
    title: 'Safe Position Builder',
    description:
      'AI recommendations for stop-loss, take-profit, and position size based on the current risk profile — disciplined entries, not guesses.',
    icon: Shield,
  },
  {
    title: 'Position Guardian',
    description:
      'Monitor open positions with SL/TP tracking, risk deterioration alerts, and weekly insights that keep you honest after you are in the trade.',
    icon: BarChart3,
  },
  {
    title: 'Shareable Risk Pages + Deployer Reputation',
    description:
      'Public risk report links with deployer reputation from GoPlus — share on X, Telegram, or copy a link without exporting PDFs.',
    icon: Share2,
  },
  {
    title: 'Proven Safe List',
    description:
      'A curated shortlist of lower-risk tokens refreshed daily from live market data. Pro unlocks the full list; Free previews one pick.',
    icon: ListChecks,
  },
] as const;

const steps = [
  {
    title: 'Enter a ticker or token address',
    description: 'Start with a symbol or contract address — no complicated setup.',
    icon: SearchCheck,
  },
  {
    title: 'We analyze key risk factors',
    description: 'Liquidity, concentration, volatility, token age, and security signals in seconds.',
    icon: Sparkles,
  },
  {
    title: 'Get a clear score + AI explanation',
    description: 'An honest score with human-readable context, not just raw data.',
    icon: ShieldCheck,
  },
  {
    title: 'Act with a plan',
    description: 'Watch, compare, build a position, or share a public report — all from one workflow.',
    icon: CheckCircleIcon,
  },
] as const;

function CheckCircleIcon({ className }: { className?: string }) {
  return <ShieldCheck className={className} />;
}

const values = [
  {
    title: 'Transparency',
    description: 'We show you exactly what we analyze – no black boxes.',
    icon: Eye,
  },
  {
    title: 'Actionable Insights',
    description: 'Not just data, but clear recommendations (size, SL, TP).',
    icon: Target,
  },
  {
    title: 'Continuous Improvement',
    description: 'We add new data sources and features based on user feedback.',
    icon: Zap,
  },
];

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-sidebar'>
       <Header />
    <main className=" text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-16 md:pb-28 md:pt-16">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            About Tradefend
          </p>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Pre-trade clarity for every crypto decision
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Tradefend is a minimal risk workspace: check tokens before you trade, monitor what you hold,
            and share reports when you need a second opinion.
          </p>
        </section>
   {/* Story */}
   <section className="mt-16">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold">The problem we solve</h2>
          <p>
            Every day, thousands of traders lose money because they don&apos;t have the right tools to assess token risk, manage position size, or monitor open trades. Rug pulls, sudden liquidity drains, and high concentration can wipe out a portfolio in minutes.
          </p>
          <p>
            Tradefend was born from personal experience – we lost money too. So we built a suite of tools that combines real-time risk analysis, AI-powered position planning, and active monitoring.
          </p>
          <h2 className="mt-8 text-2xl font-semibold">What makes us different</h2>
          <ul>
            <li><strong>Not just a scanner</strong> – We guide you from entry to exit.</li>
            <li><strong>AI recommendations</strong> – Position size, stop-loss, take-profit based on actual risk metrics.</li>
            <li><strong>Multi‑chain support</strong> – Ethereum, BSC, and more (Solana coming soon).</li>
            <li><strong>Shareable reports</strong> – SEO-friendly public pages to share analysis with your community.</li>
          </ul>
        </div>
      </section>

      {/* Features overview (compact) */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Everything included</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Shield, title: 'Risk Checker' },
            { icon: Eye, title: 'Smart Watchlist' },
            { icon: GitCompareArrows, title: 'Token Comparison' },
            { icon: Bot, title: 'AI Position Builder' },
            { icon: TrendingUp, title: 'Position Guardian' },
            { icon: Share2, title: 'Shareable Pages' },
            { icon: Users, title: 'Proven Safe List' },
            { icon: BarChart3, title: 'Activity Calendar' },
            { icon: Sparkles, title: 'Weekly Insights' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-border p-4">
              <item.icon className="size-5 text-foreground" />
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Our values</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((value, idx) => (
            <Card key={idx} className="border-border bg-card/30">
              <CardHeader>
                <value.icon className="size-8 text-foreground" strokeWidth={1.5} />
                <CardTitle className="mt-2 text-xl">{value.title}</CardTitle>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
        <section className="mt-24 md:mt-28">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything in one place</h2>
            <p className="mt-4 text-muted-foreground">
              Built for traders who want structure without noise — black-and-white UI, fast checks, honest limits.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="rounded-3xl border-border/80 bg-card dark:bg-[#1c1c1c] shadow-none">
                  <CardContent className="p-7 md:p-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight">{feature.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-24 md:mt-28">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Four steps from question to decision.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="rounded-3xl border-border/80 bg-card dark:bg-[#1c1c1c] shadow-none">
                  <CardContent className="p-7 md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Step {index + 1}
                      </p>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-3 text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-24 md:mt-28">
          <div className="rounded-3xl border border-border bg-card dark:bg-[#1c1c1c] px-8 py-12 text-center md:px-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to check your next trade?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Start with a free risk check, explore Guardian on Pro, and share public reports when you are ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/" className={cn(buttonVariants(), 'rounded-xl px-7')}>
                Try Tradefend <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/pricing" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl px-7')}>
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Footer/>
    </div>
  );
}

