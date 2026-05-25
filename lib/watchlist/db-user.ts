import { prisma } from "@/lib/prisma";

type UserMetadata = {
  display_name?: string;
  avatar_url?: string;
};

function getMetadata(userMetadata: unknown): UserMetadata {
  if (!userMetadata || typeof userMetadata !== "object") return {};
  return userMetadata as UserMetadata;
}

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: unknown;
};

export async function ensureDbUser(authUser: SupabaseAuthUser) {
  return (
    (await prisma.user.findUnique({ where: { supabaseUserId: authUser.id } })) ??
    (await prisma.user.create({
      data: {
        supabaseUserId: authUser.id,
        email: authUser.email ?? `${authUser.id}@supabase.local`,
        fullName: getMetadata(authUser.user_metadata).display_name ?? null,
        avatarUrl: getMetadata(authUser.user_metadata).avatar_url ?? null,
        subscriptionPlan: "free",
        subscriptionStatus: "inactive",
        monthlyResetDate: new Date(),
      },
    }))
  );
}
