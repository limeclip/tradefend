import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type ActivityRow = {
  date: string;
  count: bigint;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });
    if (!dbUser?.id) {
      return NextResponse.json({ activity: [] }, { status: 200 });
    }

    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - 364);

    const rows = await prisma.$queryRaw<ActivityRow[]>`
      SELECT
        DATE("createdAt")::text AS date,
        COUNT(*)::bigint AS count
      FROM "UserActivity"
      WHERE "userId" = ${dbUser.id}
        AND "createdAt" >= ${rangeStart}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const activity = rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }));

    return NextResponse.json({ activity }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
}