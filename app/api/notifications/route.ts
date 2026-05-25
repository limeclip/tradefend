import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parsePositiveInt(url.searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { notifications: [], unreadCount: 0, total: 0, page, pageSize: limit },
        { status: 200 },
      );
    }

    const where = { userId: dbUser.id };

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json(
      {
        notifications: notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
        total,
        page,
        pageSize: limit,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}
