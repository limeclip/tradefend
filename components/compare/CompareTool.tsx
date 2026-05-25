'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { GitCompareArrows, Loader2, Plus, X } from 'lucide-react';


import { CompareResultsTable } from '@/components/compare/CompareResultsTable';
import { CompareTokenCard } from '@/components/compare/CompareTokenCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COMPARE_MAX,
  COMPARE_MIN,
  COMPARE_STORAGE_KEY,
  type CompareApiResponse,
  type CompareTokenResult,
  type StoredCompareState,
} from '@/lib/compare/types';
import { normalizeCompareAddress, parseCompareSearchParams } from '@/lib/compare/urls';

const CHAIN_AUTO = 'auto';

const CHAIN_OPTIONS = [
  { value: CHAIN_AUTO, label: 'Auto-detect' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bsc', label: 'BSC' },
  { value: 'solana', label: 'Solana' },
  { value: 'base', label: 'Base' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'polygon', label: 'Polygon' },
];

function createEmptyFields(count: number): string[] {
  return Array.from({ length: count }, () => '');
}

function padFields(addresses: string[], min = COMPARE_MIN): string[] {
  const next = [...addresses];
  while (next.length < min) {
    next.push('');
  }
  return next.slice(0, COMPARE_MAX);
}

function loadStoredCompare(): StoredCompareState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCompareState;
    if (!Array.isArray(parsed.addresses)) return null;
    return {
      addresses: parsed.addresses.filter((a) => typeof a === 'string'),
      chain: typeof parsed.chain === 'string' ? parsed.chain : '',
    };
  } catch {
    return null;
  }
}

function saveStoredCompare(state: StoredCompareState) {
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function CompareTool() {
  const searchParams = useSearchParams();
  const initialized = React.useRef(false);

  const [fields, setFields] = React.useState<string[]>(() => createEmptyFields(COMPARE_MIN));
  const [chain, setChain] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<CompareTokenResult[] | null>(null);
  const [loadingCount, setLoadingCount] = React.useState(0);

  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fromUrl = parseCompareSearchParams(new URLSearchParams(searchParams.toString()));
    const stored = loadStoredCompare();

    const addresses =
      fromUrl.addresses.length > 0 ? fromUrl.addresses : (stored?.addresses ?? []);
    const chainValue = fromUrl.chain || stored?.chain || '';

    if (addresses.length > 0) {
      setFields(padFields(addresses));
      setChain(chainValue);
    }
  }, [searchParams]);

  function updateField(index: number, value: string) {
    setFields((prev) => prev.map((f, i) => (i === index ? value : f)));
  }

  function addField() {
    setFields((prev) => (prev.length >= COMPARE_MAX ? prev : [...prev, '']));
  }

  function removeField(index: number) {
    setFields((prev) => {
      if (prev.length <= COMPARE_MIN) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const addresses = fields
      .map((f) => normalizeCompareAddress(f))
      .filter(Boolean);

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const addr of addresses) {
      if (!seen.has(addr)) {
        seen.add(addr);
        unique.push(addr);
      }
    }

    if (unique.length < COMPARE_MIN) {
      setFormError(`Enter at least ${COMPARE_MIN} unique token addresses or tickers.`);
      return;
    }
    if (unique.length > COMPARE_MAX) {
      setFormError(`Maximum ${COMPARE_MAX} tokens per comparison.`);
      return;
    }

    setLoading(true);
    setLoadingCount(unique.length);
    setResults(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          addresses: unique,
          chain: chain.trim() || undefined,
        }),
      });

      const json = (await res.json().catch(() => null)) as CompareApiResponse & { error?: string };

      if (!res.ok) {
        setFormError(json?.error ?? 'Comparison request failed.');
        setLoadingCount(0);
        return;
      }

      setResults(json.results ?? []);
      saveStoredCompare({ addresses: unique, chain });
    } catch {
      setFormError('Network error. Try again.');
    } finally {
      setLoading(false);
      setLoadingCount(0);
    }
  }

  const showResults = loading || results !== null;

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void handleCompare(e)} className="space-y-6 rounded-2xl border border-border dark:border-border/50 bg-card dark:bg-[#1c1c1c] p-6 shadow-sm">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Chain (optional)</Label>
          <Select
            value={chain || CHAIN_AUTO}
            onValueChange={(v) => setChain(v === CHAIN_AUTO ? '' : (v ?? ''))}
          >
            <SelectTrigger className="w-full max-w-xs rounded-xl">
              <SelectValue placeholder="Auto-detect" />
            </SelectTrigger>
            <SelectContent>
              {CHAIN_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Token addresses or tickers</Label>
          {fields.map((field, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={field}
                onChange={(e) => updateField(index, e.target.value)}
                placeholder={index === 0 ? '0x… or BTC' : `Token ${index + 1}`}
                className="h-11 rounded-xl border-border font-mono text-sm"
                disabled={loading}
              />
              {fields.length > COMPARE_MIN ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0 rounded-xl cursor-pointer"
                  aria-label="Remove token field"
                  disabled={loading}
                  onClick={() => removeField(index)}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        {formError ? (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTitle>Cannot compare</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl cursor-pointer"
            disabled={loading || fields.length >= COMPARE_MAX}
            onClick={addField}
          >
            <Plus className="mr-2 size-4" />
            Add token
          </Button>
          <Button type="submit" className="rounded-xl cursor-pointer" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Comparing…
              </>
            ) : (
              <>
                <GitCompareArrows className="mr-2 size-4" />
                Compare
              </>
            )}
          </Button>
        </div>
      </form>

      {showResults ? (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Results</h2>

          <CompareResultsTable results={results} loadingCount={loading ? loadingCount : 0} />

          <div className="grid gap-4 md:hidden">
            {loading
              ? Array.from({ length: loadingCount }, (_, i) => (
                  <CompareTokenCard key={`sk-${i}`} result={null} loading />
                ))
              : (results ?? []).map((result) => (
                  <CompareTokenCard key={result.address} result={result} />
                ))}
          </div>

          <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: loadingCount }, (_, i) => (
                  <CompareTokenCard key={`card-sk-${i}`} result={null} loading />
                ))
              : (results ?? []).map((result) => (
                  <CompareTokenCard key={`card-${result.address}`} result={result} />
                ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
