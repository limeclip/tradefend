import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const watchlistSelect = {
  id: true,
  tokenAddress: true,
  ticker: true,
  chain: true,
  addedAt: true,
  lastCheckedAt: true,
  lastRiskScore: true,
  lastRiskLevel: true,
  notifyOnChange: true,
  notes: true,
} as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser?.id) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const items = await prisma.watchlistItem.findMany({
      where: { userId: dbUser.id },
      orderBy: { addedAt: "desc" },
      select: watchlistSelect,
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load watchlist" }, { status: 500 });
  }
}
