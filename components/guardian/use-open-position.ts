'use client';

import { toast } from 'sonner';

import type { OpenPositionRequest } from '@/lib/guardian/types';

export async function postOpenPosition(
  payload: OpenPositionRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/guardian/positions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      return { ok: false, error: json?.error ?? 'Could not open position' };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Try again.' };
  }
}

export async function openPositionWithToast(
  payload: OpenPositionRequest,
  onSuccess?: () => void,
): Promise<boolean> {
  const result = await postOpenPosition(payload);
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }
  toast.success('Position opened');
  onSuccess?.();
  return true;
}
