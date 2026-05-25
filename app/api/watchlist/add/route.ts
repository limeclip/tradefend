import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getWatchlistLimit } from "@/lib/watchlist/config";
import { ensureDbUser } from "@/lib/watchlist/db-user";
import { parseAddWatchlistBody } from "@/lib/watchlist/validation";

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = parseAddWatchlistBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const dbUser = await ensureDbUser(user);

    const [watchlistCount, existingItem] = await Promise.all([
      prisma.watchlistItem.count({ where: { userId: dbUser.id } }),
      prisma.watchlistItem.findUnique({
        where: {
          userId_tokenAddress: {
            userId: dbUser.id,
            tokenAddress: parsed.tokenAddress,
          },
        },
        select: { id: true },
      }),
    ]);

    const { maxTokens } = getWatchlistLimit(dbUser.subscriptionPlan);
    if (!existingItem && watchlistCount >= maxTokens) {
      return NextResponse.json(
        { error: "Maximum watchlist tokens reached. Upgrade to Pro." },
        { status: 403 },
      );
    }

    const now = new Date();
    const hasRiskSnapshot =
      parsed.lastRiskScore !== undefined || parsed.lastRiskLevel !== undefined;

    try {
      const item = await prisma.watchlistItem.create({
        data: {
          userId: dbUser.id,
          tokenAddress: parsed.tokenAddress,
          ticker: parsed.ticker ?? null,
          chain: parsed.chain ?? null,
          lastRiskScore: parsed.lastRiskScore ?? null,
          lastRiskLevel: parsed.lastRiskLevel ?? null,
          lastCheckedAt: hasRiskSnapshot ? now : null,
          notifyOnChange: parsed.notifyOnChange ?? true,
          notes: parsed.notes === undefined ? undefined : (parsed.notes as Prisma.InputJsonValue),
        },
        select: watchlistSelect,
      });

      return NextResponse.json({ item }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: "This token is already on your watchlist" },
          { status: 409 },
        );
      }
      throw err;
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}
