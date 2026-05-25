export type QuickDecisionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type QuickDecision = {
  level: QuickDecisionLevel;
  text: string;
};

export type QuickDecisionInput = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  overallScore: number;
  liquidityScore: number;
  concentrationScore: number;
  ticker?: string;
};

const BASE_TEXT: Record<QuickDecisionLevel, string> = {
  LOW: 'Can enter with 2-3% position, SL 15%, TP 30%',
  MEDIUM: 'Consider small position (1-2%), wait for pullback',
  HIGH: 'Better to skip or use minimal size (0.5-1%)',
  CRITICAL: 'Avoid entry, high risk of rug',
};

export function resolveQuickDecisionLevel(input: QuickDecisionInput): QuickDecisionLevel {
  const { riskLevel, overallScore, liquidityScore, concentrationScore } = input;

  if (
    riskLevel === 'HIGH' &&
    (overallScore < 35 || (liquidityScore < 35 && concentrationScore < 35))
  ) {
    return 'CRITICAL';
  }

  return riskLevel;
}

export function ruleBasedQuickDecision(input: QuickDecisionInput): QuickDecision {
  const level = resolveQuickDecisionLevel(input);
  let text = BASE_TEXT[level];

  if (level === 'LOW' && input.liquidityScore < 55) {
    text = `${text} Liquidity is moderate — keep size at the lower end.`;
  } else if (level === 'MEDIUM' && input.concentrationScore < 50) {
    text = `${text} Holder concentration is elevated — wait for clearer structure.`;
  } else if (level === 'HIGH' && input.liquidityScore < 45) {
    text = `${text} Thin liquidity increases slippage risk.`;
  }

  return { level, text };
}

function buildAiPrompt(input: QuickDecisionInput, level: QuickDecisionLevel): string {
  const token = input.ticker?.trim() || 'this token';
  return `You are a crypto trade assistant. Return ONLY valid JSON, no markdown.

Token: ${token}
Risk level: ${input.riskLevel} (decision tier: ${level})
Overall score: ${input.overallScore}/100
Liquidity score: ${input.liquidityScore}/100
Concentration score: ${input.concentrationScore}/100

JSON schema:
{ "text": string }

Rules:
- Exactly 1-2 short sentences in English.
- Include position size %, stop-loss %, and take-profit % when relevant.
- For CRITICAL tier: strongly advise avoiding entry.
- Base guidance: LOW → 2-3% size, SL 15%, TP 30%; MEDIUM → 1-2%, wait for pullback; HIGH → 0.5-1% or skip; CRITICAL → avoid entry.
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
      generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
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
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as OpenAIResponse;
  const text = json.choices?.[0]?.message?.content;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

function parseQuickDecisionText(raw: string, fallback: QuickDecision): QuickDecision {
  try {
    const obj = JSON.parse(raw.trim()) as { text?: unknown };
    if (typeof obj.text === 'string' && obj.text.trim()) {
      return { level: fallback.level, text: obj.text.trim().slice(0, 280) };
    }
  } catch {
    // use raw line if short enough
    const line = raw.trim().split(/\r?\n/).find(Boolean);
    if (line && line.length <= 280) {
      return { level: fallback.level, text: line };
    }
  }
  return fallback;
}

/** Rule-based fallback with optional Gemini/OpenAI enhancement. */
export async function generateQuickDecision(input: QuickDecisionInput): Promise<QuickDecision> {
  const fallback = ruleBasedQuickDecision(input);
  const level = fallback.level;
  const prompt = buildAiPrompt(input, level);

  try {
    const gemini = await tryGemini(prompt);
    if (gemini) return parseQuickDecisionText(gemini, fallback);
  } catch {
    // ignore
  }

  try {
    const openai = await tryOpenAI(prompt);
    if (openai) return parseQuickDecisionText(openai, fallback);
  } catch {
    // ignore
  }

  return fallback;
}

export function quickDecisionFromReport(report: {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  scores: { overall: number; liquidity: number; concentration: number };
  ticker?: string;
  quickDecision?: QuickDecision;
}): QuickDecision {
  if (report.quickDecision) return report.quickDecision;
  return ruleBasedQuickDecision({
    riskLevel: report.riskLevel,
    overallScore: report.scores.overall,
    liquidityScore: report.scores.liquidity,
    concentrationScore: report.scores.concentration,
    ticker: report.ticker,
  });
}
