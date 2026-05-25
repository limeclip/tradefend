import { randomUUID } from 'crypto';

import type { TokenRiskReport } from '@/lib/services/risk/types';

import type { PositionBuildResult, PositionSizeType } from '@/lib/guardian/types';

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

export type PositionRecommendationInput = {
  tokenAddress: string;
  chain?: string;
  ticker?: string;
  currentPrice: number;
  positionSizeValue: number;
  positionSizeType: PositionSizeType;
  takeProfitPercent?: number;
  report: TokenRiskReport;
};

type AiRecommendationPayload = {
  recommendedSizePercent: number;
  recommendedStopLossPercent: number;
  recommendedTakeProfitPercent: number;
  aiSummary: string;
};

function userSizeAsPercent(input: PositionRecommendationInput): number {
  if (input.positionSizeType === 'percent') {
    return Math.max(0.1, Math.min(100, input.positionSizeValue));
  }
  // USDT sizing without portfolio size: treat as a soft cap reference (max 10% suggestion baseline).
  return Math.max(0.1, Math.min(10, input.positionSizeValue / 1000));
}

function fallbackRecommendations(input: PositionRecommendationInput): AiRecommendationPayload {
  const { report } = input;
  const userPercent = userSizeAsPercent(input);
  const volatility = report.scores.volatility;
  const concentration = report.scores.concentration;

  let recommendedSizePercent = userPercent;
  if (report.riskLevel === 'HIGH') {
    recommendedSizePercent = Math.min(userPercent, 2);
  } else if (report.riskLevel === 'MEDIUM') {
    recommendedSizePercent = Math.min(userPercent, 5);
  } else {
    recommendedSizePercent = Math.min(userPercent, 10);
  }

  if (volatility < 40) recommendedSizePercent *= 0.75;
  if (concentration < 40) recommendedSizePercent *= 0.8;
  recommendedSizePercent = Math.round(recommendedSizePercent * 10) / 10;

  let recommendedStopLossPercent = 12;
  if (report.riskLevel === 'HIGH') recommendedStopLossPercent = 8;
  else if (report.riskLevel === 'LOW') recommendedStopLossPercent = 15;
  if (volatility < 35) recommendedStopLossPercent = Math.min(recommendedStopLossPercent + 3, 20);

  const recommendedTakeProfitPercent =
    input.takeProfitPercent ??
    (report.riskLevel === 'HIGH' ? 18 : report.riskLevel === 'MEDIUM' ? 28 : 40);

  const riskNote =
    report.riskLevel === 'HIGH'
      ? 'Risk is elevated — keep size small and use a tight stop.'
      : report.riskLevel === 'MEDIUM'
        ? 'Mixed signals — size down and wait for confirmation before adding.'
        : 'Conditions look relatively stable, but always validate liquidity before entry.';

  const aiSummary = [
    `${input.ticker ?? input.tokenAddress.slice(0, 8)} at $${input.currentPrice.toFixed(6)} shows ${report.riskLevel} risk (score ${report.scores.overall}/100).`,
    `Volatility safety ${Math.round(volatility)}/100, concentration ${Math.round(concentration)}/100.`,
    riskNote,
    `Suggested allocation: ${recommendedSizePercent}% of deposit with ${recommendedStopLossPercent}% stop-loss and ${recommendedTakeProfitPercent}% take-profit target.`,
  ].join(' ');

  return {
    recommendedSizePercent,
    recommendedStopLossPercent,
    recommendedTakeProfitPercent,
    aiSummary,
  };
}

function buildAiPrompt(input: PositionRecommendationInput): string {
  const { report } = input;
  return `You are a crypto risk coach for a "Safe Position Builder" tool.
Return ONLY valid JSON, no markdown.

Token: ${input.ticker ?? 'unknown'} (${input.tokenAddress})
Chain: ${input.chain ?? 'auto'}
Entry price USD: ${input.currentPrice}
User requested size: ${input.positionSizeValue} (${input.positionSizeType})
User take-profit preference: ${input.takeProfitPercent ?? 'none'}

Risk level: ${report.riskLevel}
Overall score: ${report.scores.overall}/100
Volatility score: ${report.scores.volatility}/100
Concentration score: ${report.scores.concentration}/100
Liquidity score: ${report.scores.liquidity}/100

JSON schema:
{
  "recommendedSizePercent": number,
  "recommendedStopLossPercent": number,
  "recommendedTakeProfitPercent": number,
  "aiSummary": string
}

Rules:
- recommendedSizePercent must be <= user's implied risk budget; HIGH risk -> cap near 1-3%, MEDIUM 2-5%, LOW up to 10%.
- recommendedStopLossPercent: 5-20 (tighter for HIGH risk / high volatility).
- recommendedTakeProfitPercent: 10-60; respect user preference if provided.
- aiSummary: 3-4 short sentences, plain English, not financial advice.`;
}

function parseAiJson(text: string, fallback: AiRecommendationPayload): AiRecommendationPayload {
  try {
    const obj = JSON.parse(text.trim()) as {
      recommendedSizePercent?: unknown;
      recommendedStopLossPercent?: unknown;
      recommendedTakeProfitPercent?: unknown;
      aiSummary?: unknown;
    };

    const size =
      typeof obj.recommendedSizePercent === 'number' && Number.isFinite(obj.recommendedSizePercent)
        ? Math.max(0.1, Math.min(100, obj.recommendedSizePercent))
        : fallback.recommendedSizePercent;
    const sl =
      typeof obj.recommendedStopLossPercent === 'number' && Number.isFinite(obj.recommendedStopLossPercent)
        ? Math.max(1, Math.min(50, obj.recommendedStopLossPercent))
        : fallback.recommendedStopLossPercent;
    const tp =
      typeof obj.recommendedTakeProfitPercent === 'number' && Number.isFinite(obj.recommendedTakeProfitPercent)
        ? Math.max(1, Math.min(200, obj.recommendedTakeProfitPercent))
        : fallback.recommendedTakeProfitPercent;
    const summary =
      typeof obj.aiSummary === 'string' && obj.aiSummary.trim()
        ? obj.aiSummary.trim().slice(0, 1200)
        : fallback.aiSummary;

    return {
      recommendedSizePercent: size,
      recommendedStopLossPercent: sl,
      recommendedTakeProfitPercent: tp,
      aiSummary: summary,
    };
  } catch {
    return fallback;
  }
}

async function tryGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
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
      max_tokens: 400,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as OpenAIResponse;
  const text = json.choices?.[0]?.message?.content;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

/** Generates AI position recommendations; falls back to rule-based logic when AI is unavailable. */
export async function generatePositionRecommendations(
  input: PositionRecommendationInput,
): Promise<PositionBuildResult> {
  const fallback = fallbackRecommendations(input);
  const prompt = buildAiPrompt(input);

  let payload = fallback;
  let usedAiProvider = false;
  const hasAi = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

  if (hasAi) {
    try {
      const gemini = await tryGemini(prompt);
      if (gemini) {
        payload = parseAiJson(gemini, fallback);
        usedAiProvider = true;
      } else {
        const openai = await tryOpenAI(prompt);
        if (openai) {
          payload = parseAiJson(openai, fallback);
          usedAiProvider = true;
        }
      }
    } catch {
      payload = fallback;
    }
  }

  const positionSizeUsdt =
    input.positionSizeType === 'usdt' ? input.positionSizeValue : undefined;
  const positionSizePercent =
    input.positionSizeType === 'percent'
      ? input.positionSizeValue
      : payload.recommendedSizePercent;

  return {
    planId: randomUUID(),
    tokenAddress: input.tokenAddress,
    chain: input.chain,
    ticker: input.ticker,
    entryPrice: input.currentPrice,
    positionSizePercent,
    positionSizeUsdt,
    stopLossPercent: payload.recommendedStopLossPercent,
    takeProfitPercent: payload.recommendedTakeProfitPercent,
    recommendedSizePercent: payload.recommendedSizePercent,
    recommendedStopLossPercent: payload.recommendedStopLossPercent,
    recommendedTakeProfitPercent: payload.recommendedTakeProfitPercent,
    aiSummary: payload.aiSummary,
    riskLevel: input.report.riskLevel,
    scores: {
      volatility: input.report.scores.volatility,
      concentration: input.report.scores.concentration,
      overall: input.report.scores.overall,
    },
    usedAi: usedAiProvider,
  };
}
