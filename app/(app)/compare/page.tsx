import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { CompareTool } from '@/components/compare/CompareTool';
import { SectionInfoButton } from '@/components/help/SectionInfoButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function CompareToolFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default async function ComparePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          Compare
        </Badge>
        <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-2xl">
            Compare Tokens
          </h1>
          <SectionInfoButton section="compare" className="mt-1 cursor-pointer" />
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Compare 2–5 tokens side by side across liquidity, concentration, volatility, and AI verdict.
        </p>
      </header>

      <Suspense fallback={<CompareToolFallback />}>
        <CompareTool />
      </Suspense>
    </div>
  );
}

