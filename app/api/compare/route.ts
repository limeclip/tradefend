import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { normalizeCompareAddress } from '@/lib/compare/urls';
import { COMPARE_MAX, COMPARE_MIN, type CompareTokenResult } from '@/lib/compare/types';
import { prisma } from '@/lib/prisma';
import {
  analyzeToken,
  INSUFFICIENT_CREDITS_MESSAGE,
  isInsufficientCreditsError,
  isTokenNotFoundError,
} from '@/lib/risk/analyze-token';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type CompareBody = {
  addresses?: unknown;
  chain?: unknown;
};

function toErrorMessage(err: unknown): string {
  if (isTokenNotFoundError(err)) {
    return 'Token not found';
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return 'Analysis failed';
}

function parseAddresses(raw: unknown): string[] | { error: string } {
  if (!Array.isArray(raw)) {
    return { error: 'addresses must be an array' };
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (typeof item !== 'string') {
      return { error: 'Each address must be a string' };
    }
    const address = normalizeCompareAddress(item);
    if (!address) {
      return { error: 'Empty address is not allowed' };
    }
    if (seen.has(address)) {
      continue;
    }
    seen.add(address);
    normalized.push(address);
  }

  if (normalized.length < COMPARE_MIN) {
    return { error: `Provide at least ${COMPARE_MIN} unique addresses` };
  }
  if (normalized.length > COMPARE_MAX) {
    return { error: `Maximum ${COMPARE_MAX} addresses allowed` };
  }

  return normalized;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as CompareBody | null;
    const parsed = parseAddresses(body?.addresses);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const chain = typeof body?.chain === 'string' ? body.chain.trim() || undefined : undefined;

    const results: CompareTokenResult[] = [];

    for (const address of parsed) {
      try {
        const data = await analyzeToken(address, chain, {
          forceRefresh: false,
          userId: dbUser.id,
          skipCreditCheck: false,
        });
        results.push({
          address,
          ticker: data.ticker ?? null,
          success: true,
          data,
        });
      } catch (err) {
        if (isInsufficientCreditsError(err)) {
          return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 403 });
        }
        results.push({
          address,
          ticker: null,
          success: false,
          error: toErrorMessage(err),
        });
      }
    }

    // Запись активности сравнения в календарь
    await prisma.userActivity.create({
      data: {
        userId: dbUser.id,
        type: 'compare',
        tokenCount: parsed.length,
        metadata: { addresses: parsed },
      },
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Comparison failed' }, { status: 500 });
  }
}