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

    const body = (await request.json().catch(() => null)) as { fullName?: unknown } | null;
    const fullNameRaw = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const fullName = fullNameRaw ? fullNameRaw.slice(0, 120) : null;

    const dbUser =
      (await prisma.user.findUnique({ where: { supabaseUserId: user.id } })) ??
      (await prisma.user.create({
        data: {
          supabaseUserId: user.id,
          email: user.email ?? `${user.id}@supabase.local`,
          fullName: getMetadata(user.user_metadata).display_name ?? null,
          avatarUrl: getMetadata(user.user_metadata).avatar_url ?? null,
        },
      }));

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { fullName },
      select: { id: true, email: true, fullName: true },
    });

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { display_name: fullName ?? "" },
    });

    if (authUpdateError) {
      return NextResponse.json(
        {
          error: "Saved in database, but failed to update auth profile metadata.",
          user: updated,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

