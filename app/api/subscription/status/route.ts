import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getMonthlyLimit } from "@/lib/subscription/limits";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(null, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        checksUsedThisMonth: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          plan: "free",
          checksUsed: 0,
          monthlyLimit: 5,
          subscriptionStatus: "inactive",
          expiresAt: null,
        },
        { status: 200 },
      );
    }

    const plan = dbUser.subscriptionPlan ?? "free";
    const subscriptionStatus = dbUser.subscriptionStatus ?? "inactive";

    return NextResponse.json(
      {
        plan,
        checksUsed: dbUser.checksUsedThisMonth,
        monthlyLimit: getMonthlyLimit({ subscriptionPlan: plan }),
        subscriptionStatus,
        expiresAt: dbUser.subscriptionExpiresAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load subscription status" }, { status: 500 });
  }
}

