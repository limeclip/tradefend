type Recommendation = "SAFE" | "CAUTION" | "AVOID";

export type AIInsight = {
  summary: string;
  recommendation: Recommendation;
  recommendationText: string;
  reasons?: string[];
};

type InsightMetrics = {
  liquidityUSD: number;
  liquidityScore: number;
  top10Percent: number | null;
  concentrationScore: number;
  priceChange24h: number;
  volatilityScore: number;
  securityScore: number;
  devSoldPercent: number | null;
  devRiskScore: number;
  tokenAgeDays: number | null;
  ageRiskScore: number;
  volumeStabilityPercentChange: number | null;
  volumeStabilityScore: number;
  overallScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type OpenAIResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

function buildPrompt(m: InsightMetrics): string {
  const top10 = m.top10Percent === null ? "unknown" : `${m.top10Percent}%`;

  const devSold = m.devSoldPercent === null ? "unknown" : `${m.devSoldPercent}%`;
  const tokenAgeDays = m.tokenAgeDays === null ? "unknown" : `${m.tokenAgeDays} days`;
  const volumeStability =
    m.volumeStabilityPercentChange === null
      ? "unknown"
      : `${m.volumeStabilityPercentChange}%`;

  return `You are a senior crypto risk analyst for a pre-trade risk checker.
You must be honest and specific. If a metric is unknown, say it is unknown and do not invent numbers.

=== METRICS ===
Liquidity: ${m.liquidityUSD} (score: ${m.liquidityScore}/100)
Holder top10: ${top10} (score: ${m.concentrationScore}/100)
24h volatility: ${m.priceChange24h}% (score: ${m.volatilityScore}/100)
Contract security: ${m.securityScore}/100
Dev wallet: sold ${devSold} (score: ${m.devRiskScore}/100)
Token age: ${tokenAgeDays} (score: ${m.ageRiskScore}/100)
Volume stability: ${volumeStability} (score: ${m.volumeStabilityScore}/100)
Overall risk: ${m.overallScore}/100 -> ${m.riskLevel}

=== REQUIREMENTS ===
Return ONLY valid JSON, no markdown, no extra text.

JSON schema:
{
  "summary": string,                    // 1-2 short sentences, plain human language
  "recommendation": "SAFE"|"CAUTION"|"AVOID",
  "reasons": [string, string, string],  // 2-3 concise bullets as sentences/fragments
  "recommendationText": string          // one line: "RECOMMENDATION: <...> — <...>"
}

Rules:
- Keep it short and actionable (no fluff).
- Mention the single biggest risk first.
- If risk is HIGH, do not recommend SAFE.
- If many metrics are unknown, lean CAUTION unless liquidity is strong and risk is LOW.
- recommendationText must start with "RECOMMENDATION:".
`;
}

function defaultInsight(riskLevel: "LOW" | "MEDIUM" | "HIGH"): AIInsight {
  if (riskLevel === "LOW") {
    return {
      summary: "Signals look relatively healthy for a short-term trade, but still validate liquidity depth and contract details.",
      recommendation: "SAFE",
      reasons: ["Decent liquidity and no major red flags in the snapshot.", "Risk is never zero — size responsibly."],
      recommendationText: "RECOMMENDATION: SAFE — acceptable risk for a small/normal position",
    };
  }
  if (riskLevel === "MEDIUM") {
    return {
      summary: "Mixed signals: this can work, but the risk/reward depends heavily on entry timing and position sizing.",
      recommendation: "CAUTION",
      reasons: ["At least one core metric is mediocre (liquidity, volatility, or security).", "Use smaller size and tighter invalidation."],
      recommendationText: "RECOMMENDATION: CAUTION — reduce size and demand better confirmation",
    };
  }
  return {
    summary: "Risk indicators are unfavorable for a clean entry. Slippage and fast adverse moves are likely.",
    recommendation: "AVOID",
    reasons: ["High concentration/volatility or weak liquidity increases tail risk.", "Wait for clearer structure or better liquidity."],
    recommendationText: "RECOMMENDATION: AVOID — too many red flags for a pre-trade entry",
  };
}

function parseInsight(text: string, fallback: AIInsight): AIInsight {
  const raw = text.trim();
  if (!raw) return fallback;

  // 1) Preferred: JSON output
  try {
    const obj = JSON.parse(raw) as {
      summary?: unknown;
      recommendation?: unknown;
      reasons?: unknown;
      recommendationText?: unknown;
    };

    const summary = typeof obj.summary === "string" && obj.summary.trim() ? obj.summary.trim().slice(0, 600) : fallback.summary;

    const rec =
      obj.recommendation === "SAFE" || obj.recommendation === "CAUTION" || obj.recommendation === "AVOID"
        ? (obj.recommendation as Recommendation)
        : fallback.recommendation;

    const recTextCandidate = typeof obj.recommendationText === "string" ? obj.recommendationText.trim() : "";
    const recommendationText =
      recTextCandidate && recTextCandidate.toUpperCase().startsWith("RECOMMENDATION:")
        ? recTextCandidate.slice(0, 200)
        : fallback.recommendationText;

    const reasons =
      Array.isArray(obj.reasons) ?
        obj.reasons
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3) :
        fallback.reasons;

    return { summary, recommendation: rec, recommendationText, reasons };
  } catch {
    // fall through to legacy parsing
  }

  // 2) Legacy: free-form text + a single recommendation line
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const recLine =
    lines.find((l) => l.includes("RECOMMENDATION: SAFE")) ??
    lines.find((l) => l.includes("RECOMMENDATION: CAUTION")) ??
    lines.find((l) => l.includes("RECOMMENDATION: AVOID")) ??
    null;

  let recommendation: Recommendation = fallback.recommendation;
  let recommendationText = fallback.recommendationText;

  if (recLine) {
    if (recLine.includes("SAFE")) recommendation = "SAFE";
    else if (recLine.includes("CAUTION")) recommendation = "CAUTION";
    else if (recLine.includes("AVOID")) recommendation = "AVOID";
    recommendationText = recLine.replace(/^✅\s*|^⚠️\s*|^🔴\s*/u, "").slice(0, 200);
    if (!recommendationText.toUpperCase().startsWith("RECOMMENDATION:")) {
      recommendationText = `RECOMMENDATION: ${recommendation} — ${recommendationText}`.slice(0, 200);
    }
  }

  const summaryLines = recLine ? lines.filter((l) => l !== recLine) : lines;
  const summary = (summaryLines.join(" ").trim() || fallback.summary).slice(0, 600);

  return { summary, recommendation, recommendationText, reasons: fallback.reasons };
}

async function tryGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
    key,
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

async function tryOpenAI(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 220,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as OpenAIResponse;
  const text = json.choices?.[0]?.message?.content;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

// ... весь код остаётся без изменений, только меняем generateAIInsight

export async function generateAIInsight(metrics: InsightMetrics): Promise<AIInsight> {
  const fallback = defaultInsight(metrics.riskLevel);
  const prompt = buildPrompt(metrics);

  let insight = fallback;
  try {
    const gemini = await tryGemini(prompt);
    if (gemini) insight = parseInsight(gemini, fallback);
  } catch {
    // ignore
  }
  if (insight === fallback) {
    try {
      const openai = await tryOpenAI(prompt);
      if (openai) insight = parseInsight(openai, fallback);
    } catch {
      // ignore
    }
  }

  // Solana: fallback 45% is an approximation — disclose it briefly.
  if (metrics.top10Percent === 45) {
    const prefix = "Holder concentration is an approximation for this token; using a generic baseline. ";
    insight.summary = (prefix + insight.summary).slice(0, 600);
  }

  return insight;
}

