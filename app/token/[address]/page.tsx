import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PublicRiskReportView } from '@/components/public/PublicRiskReportView';
import { ShareButtons } from '@/components/public/ShareButtons';
import { TokenDexChart } from '@/components/public/TokenDexChart';
import { TokenKeyMetricsLoader } from '@/components/public/TokenKeyMetricsLoader';
import { TokenKeyMetricsSkeleton } from '@/components/public/TokenKeyMetricsSkeleton';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  getPublicTokenPageData,
  PublicTokenNotFoundError,
} from '@/lib/token-cache/get-public-report';
import { buildTokenRiskJsonLd } from '@/lib/seo/token-json-ld';
import { buildPublicTokenMetadata } from '@/lib/token/metadata';
import { buildPublicTokenPageUrl } from '@/lib/token/public-url';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';
import Image from 'next/image';

type PageProps = {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ chain?: string }>;
};

/** Align with TokenCache TTL (3 hours). */
export const revalidate = 10_800;

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { address } = await params;
  const { chain } = await searchParams;
  try {
    const { report } = await getPublicTokenPageData(address, chain);
    return buildPublicTokenMetadata(report);
  } catch {
    return {
      title: 'Token Risk Report | Tradefend',
      description: 'Public pre-trade risk report on Tradefend.',
    };
  }
}

export default async function PublicTokenPage({ params, searchParams }: PageProps) {
  const { address } = await params;
  const { chain: chainParam } = await searchParams;

  let data;
  try {
    data = await getPublicTokenPageData(address, chainParam);
  } catch (err) {
    if (err instanceof PublicTokenNotFoundError) {
      notFound();
    }
    throw err;
  }

  const { report } = data;
  const ticker = report.ticker ?? report.name ?? 'Token';
  const tokenAddress = report.tokenAddress ?? report.query;
  const chain = report.chain ?? chainParam;
  const shareUrl = buildPublicTokenPageUrl(tokenAddress, report.chain);
  const jsonLd = buildTokenRiskJsonLd(report);

  return (
    <div className="min-h-screen bg-sidebar">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-foreground">
        <Image
            src={"/logo-d.png"}
            alt="Tradefend"
            width={500}
            height={600}
            className="w-8 h-auto hidden dark:block"
          />
          <Image
            src={"/logo.png"}
            alt="Tradefend"
            width={500}
            height={600}
            className="w-8 h-auto block dark:hidden"
          />
          <span className="font-semibold tracking-tight text-xl">Tradefend</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl px-4')}>
            Analyze another
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 pb-16">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Shareable risk report
          </p>
          <ShareButtons shareUrl={shareUrl} ticker={ticker} riskLevel={report.riskLevel} />
        </div>

      

        <Suspense fallback={<TokenKeyMetricsSkeleton />}>
          <TokenKeyMetricsLoader
            tokenAddress={tokenAddress}
            chainHint={chain}
            report={report}
          />
        </Suspense>

        <PublicRiskReportView report={report} />

        {chain && <TokenDexChart tokenAddress={tokenAddress} chain={chain} />}

        <div className="rounded-2xl border border-border bg-card dark:bg-[#1c1c1c] px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Want deeper checks, watchlists, and position tools?
          </p>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'mt-4 inline-flex h-11 rounded-xl bg-foreground px-6 text-background hover:bg-foreground/90',
            )}
          >
            Create free account
          </Link>
        </div>
      </main>
      <Footer/>
    </div>
  );
}
