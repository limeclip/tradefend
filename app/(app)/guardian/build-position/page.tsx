import { Suspense } from 'react';

import { BuildPositionClient } from '@/components/guardian/BuildPositionClient';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function BuildPositionFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  );
}

export default function BuildPositionPage() {
  return (
    <Suspense fallback={<BuildPositionFallback />}>
      <BuildPositionClient />
    </Suspense>
  );
}
