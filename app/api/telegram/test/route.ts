import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram/send';

export const dynamic = 'force-dynamic';

type TestBody = {
  chatId?: unknown;
};

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

    const body = (await request.json().catch(() => null)) as TestBody | null;
    const bodyChatId = typeof body?.chatId === 'string' ? body.chatId.trim() : '';

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { telegramChatId: true },
    });

    const chatId = bodyChatId || dbUser?.telegramChatId?.trim() || '';
    if (!chatId) {
      return NextResponse.json({ error: 'Telegram chat ID is required' }, { status: 400 });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
      return NextResponse.json(
        { error: 'Telegram bot is not configured on the server' },
        { status: 503 },
      );
    }

    const sent = await sendTelegramNotification(
      chatId,
      '✅ Tradefend: your Telegram is connected!',
    );

    if (!sent) {
      return NextResponse.json(
        { error: 'Telegram API rejected the message. Check chat ID and bot token.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 });
  }
}
