import { NextResponse } from 'next/server';

import {
  aggregateWeeklyStats,
  canGenerateWeeklyInsight,
  generateWeeklyInsightContent,
  nextWeeklyInsightAvailableAt,
  type WeeklyInsightPayload,
} from '@/lib/guardian/weekly-insight';
import { GUARDIAN_CONFIG } from '@/lib/guardian/config';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

function isProUser(user: {
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
}): boolean {
  const plan = user.subscriptionPlan ?? '';
  const isProPlan = (GUARDIAN_CONFIG.proPlans as readonly string[]).includes(plan);
  return user.subscriptionStatus === 'active' && isProPlan;
}

function parseStoredInsight(row: {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  stats: unknown;
  summary: string;
  recommendations: unknown;
  createdAt: Date;
}): WeeklyInsightPayload & { id: string; createdAt: string } {
  const stats = row.stats as WeeklyInsightPayload['stats'];
  const recommendations = Array.isArray(row.recommendations)
    ? row.recommendations.filter((x): x is string => typeof x === 'string')
    : [];

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    periodStart: row.periodStart.toISOString(),
    periodEnd: row.periodEnd.toISOString(),
    stats,
    summary: row.summary,
    recommendations,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const shouldGenerate = url.searchParams.get('generate') === 'true';

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        lastWeeklyInsightAt: true,
        weeklyInsightCount: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPro = isProUser(dbUser);
    const now = new Date();

    const latest = await prisma.weeklyInsight.findFirst({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    });

    const nextAvailableAt = nextWeeklyInsightAvailableAt(dbUser.lastWeeklyInsightAt, isPro);
    const allowedToGenerate = canGenerateWeeklyInsight(dbUser.lastWeeklyInsightAt, isPro, now);

    if (!shouldGenerate) {
      if (latest) {
        const insight = parseStoredInsight(latest);
        return NextResponse.json({
          insight,
          isPro,
          weeklyInsightCount: dbUser.weeklyInsightCount,
          lastWeeklyInsightAt: dbUser.lastWeeklyInsightAt?.toISOString() ?? null,
          nextAvailableAt: nextAvailableAt?.toISOString() ?? null,
          canGenerate: allowedToGenerate,
        });
      }

      return NextResponse.json({
        insight: null,
        isPro,
        weeklyInsightCount: dbUser.weeklyInsightCount,
        lastWeeklyInsightAt: null,
        nextAvailableAt: null,
        canGenerate: true,
      });
    }

    if (!allowedToGenerate) {
      return NextResponse.json(
        {
          error: 'Wait until next week',
          nextAvailableAt: nextAvailableAt?.toISOString() ?? null,
          insight: latest ? parseStoredInsight(latest) : null,
          isPro,
          canGenerate: false,
        },
        { status: 403 },
      );
    }

    const periodEnd = now;
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activities = await prisma.userActivity.findMany({
      where: {
        userId: dbUser.id,
        createdAt: { gte: periodStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = aggregateWeeklyStats(activities);
    const payload = await generateWeeklyInsightContent(stats, periodStart, periodEnd);

    const saved = await prisma.$transaction(async (tx) => {
      const row = await tx.weeklyInsight.create({
        data: {
          userId: dbUser.id,
          periodStart,
          periodEnd,
          stats: payload.stats,
          summary: payload.summary,
          recommendations: payload.recommendations,
        },
      });

      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          lastWeeklyInsightAt: now,
          weeklyInsightCount: { increment: 1 },
        },
      });

      return row;
    });

    const insight = parseStoredInsight(saved);

    return NextResponse.json({
      insight,
      isPro,
      weeklyInsightCount: dbUser.weeklyInsightCount + 1,
      lastWeeklyInsightAt: now.toISOString(),
      nextAvailableAt: nextWeeklyInsightAvailableAt(now, isPro)?.toISOString() ?? null,
      canGenerate: isPro,
      generated: true,
    });
  } catch (err: unknown) {
    console.error('[guardian/weekly-insight]', err);
    return NextResponse.json({ error: 'Failed to load weekly insight' }, { status: 500 });
  }
}
