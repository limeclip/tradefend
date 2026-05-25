'use client';

import * as React from 'react';
import { ArrowUpRight,  StarOff } from 'lucide-react';
import type { TokenRiskReport } from '@/lib/services/risk/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { RiskReportCard } from '@/components/risk/RiskReportCard';
import { cn } from '@/lib/utils';

export type FavoriteRow = {
  id: string;
  tokenQuery: string;
  createdAt: string;
};

type Props = {
  favorites: FavoriteRow[];
  isPro?: boolean;
};

function toErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== 'object') return fallback;
  const e = json as { error?: unknown };
  return typeof e.error === 'string' && e.error.trim() ? e.error : fallback;
}

export function FavoritesList({ favorites: initialFavorites, isPro = false }: Props) {
  const [favorites, setFavorites] = React.useState(initialFavorites);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<TokenRiskReport | null>(null);

  React.useEffect(() => {
    setFavorites(initialFavorites);
  }, [initialFavorites]);

  async function handleAnalyze(row: FavoriteRow) {
    setError(null);
    setLoadingId(row.id);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: row.tokenQuery, includeDetails: true }),
      });
      const json = (await res.json().catch(() => null)) as { report?: TokenRiskReport; error?: string } | null;
      if (!res.ok || !json?.report) {
        setError(toErrorMessage(json, 'Could not analyze this token.'));
        return;
      }
      setSelectedReport(json.report);
      setModalOpen(true);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !json?.success) {
        setError(toErrorMessage(json, 'Could not remove favorite.'));
        return;
      }
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError('Network error. Try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ul className="grid list-none gap-4  grid-cols-1 md:grid-cols-2">
        {isPro && favorites.length === 0 ? (
          <li className="rounded-2xl border border-border dark:border-border/50 bg-card dark:bg-[#1c1c1c] col-span-2 p-10 text-center text-muted-foreground shadow-sm">
            No favorites yet. Save a token from a risk report to see it here.
          </li>
        ) : (
          favorites.map((row) => (
            <li
              key={row.id}
              className={cn(
                'relative overflow-hidden rounded-2xl border border-border dark:border-border/50 bg-card dark:bg-[#1c1c1c] shadow-sm transition hover:bg-muted/40 dark:hover:bg-sidebar',
                'transition-shadow duration-300 hover:shadow-md',
              )}
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold tracking-tight text-foreground">{row.tokenQuery}</p>
                  <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl cursor-pointer"
                    disabled={loadingId === row.id}
                    onClick={() => void handleAnalyze(row)}
                  >
                 
                    {loadingId === row.id ? 'Analyzing…' : 'Analyze'}
                    <ArrowUpRight/>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                   className="rounded-xl cursor-pointer hover:text-destructive"
                    disabled={deletingId === row.id}
                    onClick={() => void handleDelete(row.id)}
                  >
                    <StarOff className=" size-4" />
                    {deletingId === row.id ? 'Removing…' : ''}
                  </Button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
        }}
        title="Risk report"
        className="max-w-6xl"
      >
        {selectedReport ? (
          <RiskReportCard
            report={selectedReport}
            isPro={isPro}
            onNewCheck={() => {
              setModalOpen(false);
              setSelectedReport(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

