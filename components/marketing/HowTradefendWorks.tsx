import { BarChart3, BellRing, CheckCircle2, GitCompareArrows, LineChart, Share2, ShieldCheck, ShieldUser, Sparkles, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import Link from 'next/link';
import StickyCardsSection from '../StickyCardsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { ProblemSection } from './ProblemSection';


const features = [
  {
    icon: ShieldCheck,
    title: "Pre-Trade Risk Analysis",
    description:
      "Analyze token risk before entering a trade. Liquidity, holder concentration, volatility, contract security, and AI-powered insights.",
  },
  {
    icon: BellRing,
    title: "Smart Watchlist & Alerts",
    description:
      "Track tokens after entry. Receive alerts when risk changes, liquidity drops, or market conditions become dangerous.",
  },
  {
    icon: ShieldUser,
    title: "AI Trade Companion",
    description:
      "Get position sizing, stop-loss guidance, take-profit levels, and simple AI decision support without overwhelming dashboards.",
  },
  {
    icon: LineChart,
    title: "Position Guardian",
    description:
      "Monitor active trades with real-time risk tracking, price movement alerts, and AI-assisted position management.",
  },
  {
    icon: GitCompareArrows,
    title: 'Token Comparison Tool',
    description: 'Compare 2–5 tokens side by side. Quickly find the safest entry.',
  },
  {
    icon: BarChart3,
    title: 'Activity Calendar',
    description: 'Track your trading activity and streaks.',
  },
  {
    icon: Share2,
    title: "Shareable Risk Pages",
    description:
      "Create public, SEO-friendly risk reports for any token. Share on X, Telegram, or copy link.",
  },
  {
    icon: Users,
    title: 'Proven Safe List',
    description: 'Curated daily list of low-risk tokens. Available for Pro subscribers.',
  },
  {
    icon: Sparkles,
    title: 'Weekly Personal Insight',
    description:
      'Receive a weekly AI-generated report: your most frequent risks, top tokens checked, and personalized recommendations to improve your trading discipline.',
  },
];

export function HowTradefendWorks() {
  return (
    <div className="flex flex-col w-full items-center mx-auto  py-10 ">

      <section className="py-20 bg-linear-to-t from-background from-10% via-orange-500/75 via-30% to-transparent to-90%  w-full h-[400px] items-center justify-center flex flex-col relative dark:hidden">
        {/* <div aria-hidden="true" className="jdJeEr NYfD3h inner-box wixui-box card-gradient  seperator-background inset-0 "></div> */}
      </section>

      {/* 2. Problem */}
      <ProblemSection />
      {/* 
      <section className="py-16 w-full  text-left bg-card dark:bg-[#1c1c1c]">
        <div className='max-w-5xl mx-auto px-6'>
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            How Tradefend works
          </p>
          <h2 className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            More than a token checker — your pre-trade co-pilot
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground md:text-base">
            Tradefend connects research, monitoring, and position discipline into one calm workflow — so every entry is intentional.
          </p>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-border bg-card dark:bg-[#1c1c1c] p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5 text-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Step {index + 1}
                      </p>
                      <p className="text-base font-semibold text-foreground">{step.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    </div>
                  </div>

                </li>
              );
            })}
          </ol>
        </div>
      </section> */}
      <StickyCardsSection />

      {/* VALUE */}
      <section className=" w-full bg-background dark:bg-[#1c1c1c] z-10 px-6 h-[70vh] flex flex-col items-center justify-center">
        <div className="mx-auto grid max-w-5xl gap-12 py-24 lg:grid-cols-2 ">
          <div>
            <p className="text-sm font-medium text-orange-500 dark:text-amber-500">
              Why Tradefend
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Most traders focus on profit.
              <br />
              Professionals focus on risk.
            </h2>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p>
              Tradefend is not just another token scanner.
            </p>

            <p>
              It’s an AI-powered trading safety system designed to help traders
              make more informed decisions before entering a position and while
              managing it.
            </p>

            <p>
              Instead of overwhelming users with complex dashboards and noisy
              signals, Tradefend focuses on one thing:
            </p>

            <div className="rounded-3xl border p-6 text-lg font-medium text-foreground">
              Helping you avoid unnecessary losses.
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="w-full bg-sidebar z-10 px-6">
        <div className="mx-auto max-w-5xl  py-24 ">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-orange-500 dark:text-amber-500">
              Core Features
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Built for modern crypto traders.
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="rounded-3xl ring-foreground/10 dark:ring-border/50 shadow-sm  bg-background dark:bg-[#1c1c1c]"
              >
                <CardContent className="p-8">
                  <feature.icon strokeWidth={0.75} className="h-10 w-10" />

                  <h3 className="mt-6 text-2xl font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-4 leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* AI SECTION */}
      <section className="w-full bg-sidebar  z-10 px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-16  py-24 lg:grid-cols-2 ">
          <div>
            <div className="inline-flex rounded-full border px-4 py-1 text-sm">
              AI Companion
            </div>

            <h2 className="mt-6 text-4xl font-semibold tracking-tight">
              Your trading assistant.
              <br />
              Without the noise.
            </h2>

            <div className="mt-8 space-y-5 text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5" />
                <p>Position sizing recommendations</p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5" />
                <p>Smart stop-loss & take-profit guidance</p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5" />
                <p>Quick AI trade decisions</p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5" />
                <p>Risk monitoring after entry</p>
              </div>
            </div>
          </div>

          <Card className="rounded-2xl ring-foreground/10 dark:ring-border/50 shadow-sm bg-background dark:bg-[#1c1c1c]">
            <CardContent className="p-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />

                <p className="font-medium">AI Trade Insight</p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    Recommendation
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    Low-size entry possible
                  </p>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    Suggested Position
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    2–3% of portfolio
                  </p>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    Risk Warning
                  </p>

                  <p className="mt-2 text-lg">
                    Holder concentration remains elevated. Monitor liquidity
                    closely.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className='w-full z-10 bg-background dark:bg-[#1c1c1c]'>
        <div className="mx-auto max-w-4xl px-6 py-28 text-center ">
          <h2 className="text-5xl font-semibold tracking-tight">
            Make safer trading decisions.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Tradefend combines token risk analysis, AI monitoring, and smart
            position management into one clean workflow.
          </p>

          <div className="mt-10">
            <Link href="/register">
              <Button size="lg" className="rounded-full px-8 cursor-pointer">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
