import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ hasPending: false }, { status: 200 });
    }

    const pendingOrder = await prisma.payProOrder.findFirst({
      where: { userId: dbUser.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });

    if (!pendingOrder) {
      return NextResponse.json({ hasPending: false }, { status: 200 });
    }

    return NextResponse.json(
      { hasPending: true, subscriptionId: pendingOrder.orderId },
      { status: 200 },
    );
  } catch (error) {
    console.error("Pending subscription check error:", error);
    return NextResponse.json({ error: "Failed to check pending subscription" }, { status: 500 });
  }
}
