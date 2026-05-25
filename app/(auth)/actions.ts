"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type AuthState = {
  error?: string;
  success?: string;
};

async function getRedirectTo(path: string) {
  const headerList = await headers();
  const origin = headerList.get("origin");
  return origin ? `${origin}${path}` : path;
}

export async function loginWithPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function registerWithPassword(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? ""); // новое поле

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await getRedirectTo("/auth/callback?next=/dashboard"),
      data: {
        display_name: fullName, // сохраняем в metadata Supabase (опционально)
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const supabaseUserId = data.user?.id;
  if (!supabaseUserId) {
    return { error: "Failed to get user ID from Supabase" };
  }

  try {
    await prisma.user.upsert({
      where: { supabaseUserId: supabaseUserId },
      update: {
        fullName: fullName || undefined,
      },
      create: {
        supabaseUserId: supabaseUserId,
        email: email,
        fullName: fullName || null,
      },
    });
  } catch (dbError) {
    console.error(dbError);
    return { error: "Failed to save user to database" };
  }

  return { success: "Check your email to confirm your account." };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await getRedirectTo("/auth/callback?next=/dashboard"),
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login");
}

// ========== FORGOT PASSWORD ==========

export async function forgotPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getRedirectTo("/update-password"),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent to your email." };
}