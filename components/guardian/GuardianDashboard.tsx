'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ActivePositionsList } from '@/components/guardian/ActivePositionsList';
import { PositionPlansList } from '@/components/guardian/PositionPlansList';
import { WeeklyInsightPanel } from '@/components/guardian/WeeklyInsightPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function PlansTabFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

function GuardianDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'plans';
  const [positionsRefreshKey, setPositionsRefreshKey] = React.useState(0);

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    if (value !== 'plans') {
      params.delete('plansPage');
    }
    router.push(`/guardian?${params.toString()}`);
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-2 grid w-full max-w-2xl grid-cols-3">
        <TabsTrigger value="plans">Position Plans</TabsTrigger>
        <TabsTrigger value="positions">Active Positions</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="plans">
        <Suspense fallback={<PlansTabFallback />}>
          <PositionPlansList
            onPositionOpened={() => {
              setPositionsRefreshKey((k) => k + 1);
              setTab('positions');
            }}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="positions">
        <ActivePositionsList refreshKey={positionsRefreshKey} />
      </TabsContent>

      <TabsContent value="insights">
        <WeeklyInsightPanel />
      </TabsContent>
    </Tabs>
  );
}

export function GuardianDashboard() {
  return (
    <Suspense fallback={<PlansTabFallback />}>
      <GuardianDashboardInner />
    </Suspense>
  );
}
