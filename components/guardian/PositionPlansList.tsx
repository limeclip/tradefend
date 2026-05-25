'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

import { PositionPlanCard } from '@/components/guardian/PositionPlanCard';
import { PositionPlanDetailModal } from '@/components/guardian/PositionPlanDetailModal';
import { GUARDIAN_CARD_GRID } from '@/components/guardian/guardian-grid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { PositionPlanRow, UserPositionRow } from '@/lib/guardian/types';

const PAGE_SIZE = 18;

type Props = {
  onPositionOpened?: () => void;
};

function buildPlansUrl(page: number): string {
  const params = new URLSearchParams();
  params.set('tab', 'plans');
  if (page > 1) params.set('plansPage', String(page));
  return `/guardian?${params.toString()}`;
}

export function PositionPlansList({ onPositionOpened }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = React.useMemo(() => {
    const raw = searchParams.get('plansPage');
    const n = raw ? Number.parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const [plans, setPlans] = React.useState<PositionPlanRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [openKeys, setOpenKeys] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [openingPlanId, setOpeningPlanId] = React.useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = React.useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<PositionPlanRow | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, posRes] = await Promise.all([
        fetch(`/api/guardian/plans?page=${page}&pageSize=${PAGE_SIZE}`, { cache: 'no-store' }),
        fetch('/api/guardian/positions', { cache: 'no-store' }),
      ]);

      const plansJson = (await plansRes.json().catch(() => null)) as {
        plans?: PositionPlanRow[];
        total?: number;
      } | null;
      const posJson = (await posRes.json().catch(() => null)) as { positions?: UserPositionRow[] } | null;

      const planList = plansRes.ok && plansJson?.plans ? plansJson.plans : [];
      const positions = posRes.ok && posJson?.positions ? posJson.positions : [];

      const keys = new Set<string>();
      for (const p of positions) {
        keys.add(p.tokenAddress.toLowerCase());
        if (p.aiPlanId) keys.add(p.aiPlanId);
      }

      setPlans(planList);
      setTotal(plansJson?.total ?? planList.length);
      setOpenKeys(keys);
    } catch {
      setPlans([]);
      setTotal(0);
      setOpenKeys(new Set());
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  function planIsOpen(plan: PositionPlanRow): boolean {
    return openKeys.has(plan.id) || openKeys.has(plan.tokenAddress.toLowerCase());
  }

  async function handleDeletePlan(planId: string) {
    setDeletingPlanId(planId);
    try {
      const res = await fetch(`/api/guardian/plans/${planId}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Could not delete plan');
        return;
      }
      toast.success('Plan deleted');
      if (selectedPlan?.id === planId) {
        setModalOpen(false);
        setSelectedPlan(null);
      }
      if (plans.length === 1 && page > 1) {
        router.push(buildPlansUrl(page - 1));
      } else {
        void load();
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingPlanId(null);
    }
  }

  if (loading) {
    return (
      <section className={GUARDIAN_CARD_GRID}>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </section>
    );
  }

  if (!plans.length && total === 0) {
    return <PositionPlansEmptyHint />;
  }

  return (
    <>
      <ul className={`${GUARDIAN_CARD_GRID} list-none p-0`}>
        {plans.map((plan) => (
          <li key={plan.id} className="min-h-[200px]">
            <PositionPlanCard
              plan={plan}
              hasOpenPosition={planIsOpen(plan)}
              opening={openingPlanId === plan.id}
              deleting={deletingPlanId === plan.id}
              onViewPlan={() => {
                setSelectedPlan(plan);
                setModalOpen(true);
              }}
              onDelete={() => void handleDeletePlan(plan.id)}
              onOpenStarted={() => setOpeningPlanId(plan.id)}
              onOpenEnded={() => setOpeningPlanId(null)}
              onOpened={() => {
                void load();
                onPositionOpened?.();
              }}
            />
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={safePage > 1 ? buildPlansUrl(safePage - 1) : '#'}
                aria-disabled={safePage <= 1}
                className={safePage <= 1 ? 'pointer-events-none opacity-50' : undefined}
                onClick={(e) => {
                  if (safePage <= 1) e.preventDefault();
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis ? (
                      <PaginationItem>
                        <span className="px-2 text-muted-foreground">…</span>
                      </PaginationItem>
                    ) : null}
                    <PaginationItem>
                      <PaginationLink href={buildPlansUrl(p)} isActive={p === safePage}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              })}
            <PaginationItem>
              <PaginationNext
                href={safePage < totalPages ? buildPlansUrl(safePage + 1) : '#'}
                aria-disabled={safePage >= totalPages}
                className={safePage >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                onClick={(e) => {
                  if (safePage >= totalPages) e.preventDefault();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <PositionPlanDetailModal
        plan={selectedPlan}
        open={modalOpen}
        hasOpenPosition={selectedPlan ? planIsOpen(selectedPlan) : false}
        onClose={() => setModalOpen(false)}
        onOpened={() => {
          void load();
          onPositionOpened?.();
        }}
      />
    </>
  );
}

export function PositionPlansEmptyHint() {
  return (
    <Card className="rounded-xl  ring-foreground/10 dark:ring-border/50 bg-card dark:bg-[#1c1c1c]  p-10 text-center items-center justify-center shadow-none">
      <Shield className="mx-auto size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-base font-semibold text-foreground">No saved plans</p>
      <p className="text-[13px] text-muted-foreground">
        Build a safe plan from a risk report, then save it here.
      </p>
      <Link href="/dashboard" className="inline-flex mt-2">
        <Button variant="default" className="h-9 cursor-pointer">
          Go to dashboard
        </Button>
      </Link>
    </Card>
  );
}
