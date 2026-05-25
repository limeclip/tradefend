import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type MarkReadBody = {
  ids?: unknown;
  all?: unknown;
};

export async function PATCH(request: Request) {
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

    const body = (await request.json().catch(() => null)) as MarkReadBody | null;
    const markAll = body?.all === true;

    if (markAll) {
      const result = await prisma.notification.updateMany({
        where: { userId: dbUser.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ updated: result.count }, { status: 200 });
    }

    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Provide ids or all: true' }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: dbUser.id,
        id: { in: ids },
      },
      data: { read: true },
    });

    return NextResponse.json({ updated: result.count }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
