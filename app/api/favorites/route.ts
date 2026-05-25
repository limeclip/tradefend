import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type UserMetadata = {
  display_name?: string;
  avatar_url?: string;
};

function getMetadata(userMetadata: unknown): UserMetadata {
  if (!userMetadata || typeof userMetadata !== "object") return {};
  return userMetadata as UserMetadata;
}

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ favorites: [] }, { status: 200 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, tokenQuery: true, createdAt: true },
    });

    return NextResponse.json({ favorites }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

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

    const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Ensure DB user exists (OAuth callback/register already upsert; this is a safety net)
    const dbUser =
      (await prisma.user.findUnique({ where: { supabaseUserId: user.id } })) ??
      (await prisma.user.create({
        data: {
          supabaseUserId: user.id,
          email: user.email ?? `${user.id}@supabase.local`,
          fullName: getMetadata(user.user_metadata).display_name ?? null,
          avatarUrl: getMetadata(user.user_metadata).avatar_url ?? null,
          subscriptionPlan: "free",
          subscriptionStatus: "inactive",
          monthlyResetDate: new Date(),
        },
      }));

    if (dbUser.subscriptionStatus !== "active") {
      return NextResponse.json({ error: "Only Pro users can add favorites. Upgrade to Pro." }, { status: 403 });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_tokenQuery: {
          userId: dbUser.id,
          tokenQuery: query,
        },
      },
      create: {
        userId: dbUser.id,
        tokenQuery: query,
      },
      update: {},
      select: { id: true, tokenQuery: true, createdAt: true },
    });

    return NextResponse.json({ favorite }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}

