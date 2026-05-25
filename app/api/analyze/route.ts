import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  analyzeToken,
  INSUFFICIENT_CREDITS_MESSAGE,
  isInsufficientCreditsError,
  isTokenNotFoundError,
} from "@/lib/risk/analyze-token";
import type { TokenRiskReport } from "@/lib/services/risk/types";

type UserMetadata = {
  display_name?: string;
  avatar_url?: string;
};

function getMetadata(userMetadata: unknown): UserMetadata {
  if (!userMetadata || typeof userMetadata !== "object") return {};
  return userMetadata as UserMetadata;
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

    const body = (await request.json().catch(() => null)) as
      | { query?: unknown; forceRefresh?: unknown; includeDetails?: unknown }
      | null;
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const forceRefresh = body?.forceRefresh === true;
    const includeDetails = body?.includeDetails === true;
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

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

    const report = await analyzeToken(query, undefined, {
      forceRefresh,
      userId: dbUser.id,
      skipCreditCheck: false,
    });

    const queryType = query.startsWith("0x") ? "address" : "token";

    const searchHistory = await prisma.searchHistory.create({
      data: {
        userId: dbUser.id,
        query,
        queryType,
      },
    });

    await prisma.tokenCheck.create({
      data: {
        userId: dbUser.id,
        searchHistoryId: searchHistory.id,
        ticker: report.ticker ?? null,
        tokenAddress: report.tokenAddress ?? null,
        chain: report.chain ?? null,
        contractScore: report.scores.contractSecurity,
        liquidityScore: report.scores.liquidity,
        volatilityScore: report.scores.volatility,
        overallRisk: report.riskLevel,
        notes: {
          aiInsight: report.aiInsight,
          quickDecision: report.quickDecision,
          scores: report.scores,
          data: report.data,
        },
      },
    });

    // Запись активности в календарь
    await prisma.userActivity.create({
      data: {
        userId: dbUser.id,
        type: 'token_check',
        address: query,
        metadata: { risk: report.scores?.overall },
      },
    });

    type TokenRiskReportResponse = Omit<TokenRiskReport, "data"> & { data?: TokenRiskReport["data"] };

    const responseReport: TokenRiskReportResponse = includeDetails
      ? report
      : { ...report, data: undefined };

    return NextResponse.json({ report: responseReport }, { status: 200 });
  } catch (err: unknown) {
    if (isInsufficientCreditsError(err)) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 403 });
    }
    if (isTokenNotFoundError(err)) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    console.error(err);
    return NextResponse.json({ error: "Risk engine unavailable" }, { status: 500 });
  }
}