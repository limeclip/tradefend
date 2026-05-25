import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type SettingsBody = {
  telegramChatId?: unknown;
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

    const body = (await request.json().catch(() => null)) as SettingsBody | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let telegramChatId: string | null | undefined;
    if (body.telegramChatId === null || body.telegramChatId === '') {
      telegramChatId = null;
    } else if (typeof body.telegramChatId === 'string') {
      const trimmed = body.telegramChatId.trim();
      if (!/^\d+$/.test(trimmed)) {
        return NextResponse.json(
          { error: 'Telegram chat ID must be a numeric ID from @userinfobot' },
          { status: 400 },
        );
      }
      telegramChatId = trimmed;
    } else if (body.telegramChatId !== undefined) {
      return NextResponse.json({ error: 'Invalid telegramChatId' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (telegramChatId === undefined) {
      return NextResponse.json({ error: 'No settings to update' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { telegramChatId },
      select: { telegramChatId: true },
    });

    return NextResponse.json({ telegramChatId: updated.telegramChatId }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function GET() {
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
      select: { telegramChatId: true },
    });

    return NextResponse.json(
      { telegramChatId: dbUser?.telegramChatId ?? null },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
