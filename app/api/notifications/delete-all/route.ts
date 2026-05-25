import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE() {
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

    const result = await prisma.notification.deleteMany({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({ deleted: result.count }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
