import type { UserActivity } from '@prisma/client';

export type WeeklyInsightStats = {
  totalChecks: number;
  totalCompares: number;
  totalActivity: number;
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  topTokens: Array<{ address: string; count: number }>;
  averageRiskScore: number | null;
};

export type WeeklyInsightPayload = {
  periodStart: string;
  periodEnd: string;
  stats: WeeklyInsightStats;
  summary: string;
  recommendations: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function overallToRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 70) return 'LOW';
  if (score >= 40) return 'MEDIUM';
  return 'HIGH';
}

function extractOverallScore(metadata: unknown): number | null {
  if (!isRecord(metadata)) return null;
  const risk = metadata.risk;
  return typeof risk === 'number' && Number.isFinite(risk) ? risk : null;
}

export function aggregateWeeklyStats(activities: UserActivity[]): WeeklyInsightStats {
  let totalChecks = 0;
  let totalCompares = 0;
  const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const tokenCounts = new Map<string, number>();
  const riskScores: number[] = [];

  for (const activity of activities) {
    if (activity.type === 'token_check') {
      totalChecks += 1;
      const address = activity.address?.trim().toLowerCase();
      if (address) {
        tokenCounts.set(address, (tokenCounts.get(address) ?? 0) + 1);
      }
      const score = extractOverallScore(activity.metadata);
      if (score !== null) {
        riskScores.push(score);
        const level = overallToRiskLevel(score);
        riskDistribution[level] += 1;
      }
    } else if (activity.type === 'compare') {
      totalCompares += 1;
    }
  }

  const topTokens = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([address, count]) => ({ address, count }));

  const averageRiskScore =
    riskScores.length > 0
      ? Math.round(riskScores.reduce((sum, n) => sum + n, 0) / riskScores.length)
      : null;

  return {
    totalChecks,
    totalCompares,
    totalActivity: totalChecks + totalCompares,
    riskDistribution,
    topTokens,
    averageRiskScore,
  };
}

function ruleBasedWeeklyInsight(stats: WeeklyInsightStats): { summary: string; recommendations: string[] } {
  if (stats.totalActivity === 0) {
    return {
      summary: 'No token checks or comparisons in the last 7 days. Run a few analyses to unlock personalized insights.',
      recommendations: [
        'Start with 2–3 tokens you are considering this week.',
        'Use Compare to validate pairs before sizing a position.',
        'Save high-conviction setups to your watchlist for monitoring.',
      ],
    };
  }

  const { LOW, MEDIUM, HIGH } = stats.riskDistribution;
  const dominant =
    HIGH >= LOW && HIGH >= MEDIUM
      ? 'higher-risk'
      : LOW >= MEDIUM && LOW >= HIGH
        ? 'lower-risk'
        : 'mixed-risk';

  const summary = `You ran ${stats.totalChecks} check${stats.totalChecks === 1 ? '' : 's'} and ${stats.totalCompares} comparison${stats.totalCompares === 1 ? '' : 'es'} this week. Your activity skews toward ${dominant} tokens${
    stats.averageRiskScore !== null ? ` (avg. score ${stats.averageRiskScore}/100)` : ''
  }.`;

  const recommendations: string[] = [];

  if (HIGH > LOW + MEDIUM) {
    recommendations.push('Reduce position sizes on speculative names — cap new entries at 0.5–1%.');
    recommendations.push('Prioritize liquidity and holder concentration before entering.');
  } else if (LOW > HIGH) {
    recommendations.push('You are screening cleaner setups — keep using 2–3% sizing with defined SL/TP.');
    recommendations.push('Re-check watchlist tokens before increasing size.');
  } else {
    recommendations.push('Stay selective: use smaller size on MEDIUM-risk names until confirmation.');
    recommendations.push('Batch similar tickers with Compare to avoid duplicate exposure.');
  }

  if (stats.topTokens.length > 0) {
    const top = stats.topTokens[0];
    recommendations.push(
      `You checked ${top.address.slice(0, 8)}… most often — verify it still matches your plan before adding size.`,
    );
  }

  recommendations.push('Next week: limit fresh entries to 1–2 tokens and journal why each passed your filter.');

  return { summary, recommendations: recommendations.slice(0, 4) };
}

function buildWeeklyPrompt(stats: WeeklyInsightStats): string {
  return `You are a personal crypto trading coach. Analyze the user's last 7 days and return ONLY valid JSON.

Activity:
- Token checks: ${stats.totalChecks}
- Comparisons: ${stats.totalCompares}
- Risk distribution: LOW ${stats.riskDistribution.LOW}, MEDIUM ${stats.riskDistribution.MEDIUM}, HIGH ${stats.riskDistribution.HIGH}
- Average risk score: ${stats.averageRiskScore ?? 'n/a'}
- Top tokens: ${stats.topTokens.map((t) => `${t.address} (${t.count}x)`).join(', ') || 'none'}

JSON schema:
{
  "summary": string,
  "recommendations": [string, string, string]
}

Rules:
- summary: 2 sentences max, encouraging but honest
- recommendations: exactly 3 actionable bullets for next week
- English only, no markdown
`;
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

async function tryGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

async function tryOpenAI(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as OpenAIResponse;
  const text = json.choices?.[0]?.message?.content;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

function parseWeeklyAi(
  raw: string,
  fallback: { summary: string; recommendations: string[] },
): { summary: string; recommendations: string[] } {
  try {
    const obj = JSON.parse(raw.trim()) as { summary?: unknown; recommendations?: unknown };
    const summary =
      typeof obj.summary === 'string' && obj.summary.trim()
        ? obj.summary.trim().slice(0, 600)
        : fallback.summary;
    const recommendations = Array.isArray(obj.recommendations)
      ? obj.recommendations
          .filter((x): x is string => typeof x === 'string')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
      : fallback.recommendations;
    return { summary, recommendations: recommendations.length ? recommendations : fallback.recommendations };
  } catch {
    return fallback;
  }
}

export async function generateWeeklyInsightContent(
  stats: WeeklyInsightStats,
  periodStart: Date,
  periodEnd: Date,
): Promise<WeeklyInsightPayload> {
  const fallback = ruleBasedWeeklyInsight(stats);
  const prompt = buildWeeklyPrompt(stats);

  let copy = fallback;
  try {
    const gemini = await tryGemini(prompt);
    if (gemini) copy = parseWeeklyAi(gemini, fallback);
  } catch {
    // ignore
  }

  if (copy === fallback) {
    try {
      const openai = await tryOpenAI(prompt);
      if (openai) copy = parseWeeklyAi(openai, fallback);
    } catch {
      // ignore
    }
  }

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    stats,
    summary: copy.summary,
    recommendations: copy.recommendations,
  };
}

export const FREE_WEEKLY_INSIGHT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const PRO_WEEKLY_INSIGHT_CACHE_MS = 24 * 60 * 60 * 1000;

export function nextWeeklyInsightAvailableAt(
  lastAt: Date | null | undefined,
  isPro: boolean,
): Date | null {
  if (!lastAt) return null;
  const cooldown = isPro ? PRO_WEEKLY_INSIGHT_CACHE_MS : FREE_WEEKLY_INSIGHT_COOLDOWN_MS;
  return new Date(lastAt.getTime() + cooldown);
}

export function canGenerateWeeklyInsight(
  lastAt: Date | null | undefined,
  isPro: boolean,
  now = new Date(),
): boolean {
  if (isPro) return true;
  if (!lastAt) return true;
  const next = nextWeeklyInsightAvailableAt(lastAt, false);
  return !next || now >= next;
}
