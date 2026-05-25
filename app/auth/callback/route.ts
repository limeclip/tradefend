// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const supabaseUserId = data.user.id;
      const email = data.user.email;
      const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name;
      const avatarUrl = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture;

      // Создаём или обновляем пользователя в Prisma
      await prisma.user.upsert({
        where: { supabaseUserId: supabaseUserId },
        update: {
          email: email ?? undefined,
          fullName: fullName ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        },
        create: {
          supabaseUserId: supabaseUserId,
          email: email ?? "",
          fullName: fullName ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        },
      });
    }
  }

  // Редирект на нужную страницу (обычно /dashboard)
  return NextResponse.redirect(new URL(next, request.url));
}