"use client";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import type { TokenRiskReport } from "@/lib/services/risk/types";
import { HowTradefendWorks } from "@/components/marketing/HowTradefendWorks";
import { RiskReportCard } from "@/components/risk/RiskReportCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";



export default function Home() {
  const { session } = useAuth();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<TokenRiskReport | null>(null);

  const examples = ["SOL", "ETH", "BTC", "ARB", "USDC", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"];

  async function analyze(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    if (!session) {
      router.push(`/login?redirect=/`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: trimmed, includeDetails: true }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/`);
        return;
      }

      const json = (await res.json().catch(() => null)) as { report?: TokenRiskReport; error?: string } | null;
      if (!res.ok || !json?.report) {
        setError(json?.error ?? "Analyze failed. Please try again.");
        return;
      }

      setReport(json.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-sidebar ">
        <div className="min-h-screen h-full flex flex-col w-full">
          <Header />
          <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-16 pt-14 text-center h-full flex-1">
            <Badge variant="outline" className="mb-5 rounded-full px-4 ">
              Pre-Trade Risk Checker
            </Badge>
            <h1 className="mx-auto max-w-5xl text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl ">
              Don&apos;t Lose <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">Money </span><span className="-ml-5">.</span>
              <span className="block  bg-linear-to-r from-black via-zinc-600 to-zinc-500 dark:from-white dark:via-gray-400 dark:to-gray-100 bg-clip-text text-transparent">Trade with Confidence.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-500 dark:text-zinc-400">
              Tradefend combines real-time risk analysis, AI-powered position builder, and active position monitoring to help you avoid rug pulls, manage drawdown, and grow your portfolio safely.
            </p>
            <p className="mt-6 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Paste a token address or ticker and get a clean risk snapshot in seconds.
            </p>
            <Card className="mt-12 w-full max-w-3xl rounded-3xl bg-card dark:bg-[#1c1c1c] ring-foreground/10 dark:ring-border/50 p-3 shadow-none">
              <CardContent className="flex flex-col gap-3 p-2 sm:flex-row">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter ticker or token contract address..."
                  className="h-12 border-0 bg-card dark:bg-[#1c1c1c]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") analyze(query);
                  }}
                />
                <Button className="h-12 rounded-xl px-6 cursor-pointer" disabled={submitting} onClick={() => analyze(query)}>
                  {submitting ? "Analyzing..." : "Analyze"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
              <span className="mr-2 text-zinc-400">Examples</span>
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="rounded-full border border-border bg-card dark:bg-[#1c1c1c] px-3 py-1.5 text-zinc-500 dark:text-zinc-400 cursor-pointer"
                  onClick={() => {
                    setQuery(ex);
                    void analyze(ex);
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>


            {error ? <p className="mt-6 max-w-2xl text-sm text-red-600">{error}</p> : null}

            {report ? (
              <div className="mt-10 w-full text-left">
                <RiskReportCard
                  report={report}
                  onNewCheck={() => {
                    setReport(null);
                    setError(null);
                    setQuery("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            ) : null}

            <div className="mt-10 hidden md:flex items-center gap-8 text-sm text-zinc-500">
              <span>Low risk: green indicators</span>
              <span>High risk: red flags</span>
              <span>Built for fast decision flow</span>
            </div>



          </main>
          {!report && !session?
            <>
              <div className="mt-auto hidden md:flex flex-col max-w-4xl mx-auto px-6 w-full pb-6 gap-10">
                <div className="flex items-center justify-between max-w-5xl text-center text-sm">
                  <div className="flex items-center justify-center gap-3 w-full group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border text-sm text-zinc-500 dark:text-zinc-400 group-hover:bg-muted group-hover:text-foreground"><ChevronRight className="size-4" /></div>
                    <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-foreground ">Risk Check</div>
                  </div>
                  <div className="flex items-center justify-center gap-3  w-full group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border text-sm text-zinc-500 dark:text-zinc-400 group-hover:bg-muted group-hover:text-background"><ChevronRight className="size-4" /></div>
                    <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-foreground">Smart watchlist </div>
                  </div>
                  <div className="flex items-center justify-center gap-3  w-full group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border text-sm text-zinc-500 dark:text-zinc-400 group-hover:bg-muted group-hover:text-background"><ChevronRight className="size-4" /></div>
                    <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-foreground">Compare</div>
                  </div>
                  <div className="flex items-center justify-center gap-3  w-full group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border text-sm text-zinc-500 dark:text-zinc-400 group-hover:bg-muted group-hover:text-background"><ChevronRight className="size-4" /></div>
                    <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-foreground">Position Builder & Guardian</div>
                  </div>
                </div>
              </div>
            </>
            : null}
              {session ? 
              <>
               <div className="mt-auto flex flex-col max-w-5xl mx-auto px-6 w-full pt-4">
               <Footer />
                </div>
              </>
              : null
            }
        </div>

        {!report && !session ? 
        <>
        <HowTradefendWorks /> 
        <Footer />
        </>
        : null}
       
      </div>
    </>
  );
}
