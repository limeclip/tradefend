import { getAppUrl } from '@/lib/app-url';
import { analyzeToken, isInsufficientCreditsError, isTokenNotFoundError } from '@/lib/risk/analyze-token';
import { prisma } from '@/lib/prisma';
import {
  formatWatchlistRiskChangeMessage,
  sendTelegramNotification,
} from '@/lib/telegram/send';
import { getWatchlistLimit } from '@/lib/watchlist/config';
import { isSignificantRiskChange } from '@/lib/watchlist/risk-change';

const MS_PER_HOUR = 60 * 60 * 1000;

export type WatchlistCheckStats = {
  tokensChecked: number;
  tokensSkipped: number;
  tokensUpdated: number;
  notificationsCreated: number;
  telegramSent: number;
  errors: number;
};

export type WatchlistItemForCheck = {
  id: string;
  userId: string;
  tokenAddress: string;
  ticker: string | null;
  chain: string | null;
  lastRiskLevel: string | null;
  lastCheckedAt: Date | null;
  subscriptionPlan: string | null;
  notifyOnChange: boolean;
  user: {
    telegramChatId: string | null;
  };
};

function resolveAnalyzeQuery(item: WatchlistItemForCheck): string {
  const address = item.tokenAddress.trim();
  if (address.startsWith('0x') || address.length >= 32) {
    return address;
  }
  if (item.ticker?.trim()) {
    return item.ticker.trim();
  }
  return address;
}

export type RunWatchlistCheckOptions = {
  forceRefresh?: boolean;
  /** When true, analysis runs without charging user credits (cron). */
  skipCreditCheck?: boolean;
  /** When true, bypass per-plan cache and always call the API (manual refresh). */
  skipCache?: boolean;
};

export async function runWatchlistCheck(
  items: WatchlistItemForCheck[],
  options?: RunWatchlistCheckOptions,
): Promise<WatchlistCheckStats> {
  const stats: WatchlistCheckStats = {
    tokensChecked: 0,
    tokensSkipped: 0,
    tokensUpdated: 0,
    notificationsCreated: 0,
    telegramSent: 0,
    errors: 0,
  };

  const watchlistUrl = `${getAppUrl()}/watchlist`;
  const now = new Date();
  const skipCache = options?.skipCache ?? false;

  for (const item of items) {
    const { cacheHours } = getWatchlistLimit(item.subscriptionPlan);

    // Cron: skip API call when last check is still within the plan cache window.
    if (!skipCache && item.lastCheckedAt) {
      const elapsedMs = Date.now() - new Date(item.lastCheckedAt).getTime();
      if (elapsedMs < cacheHours * MS_PER_HOUR) {
        stats.tokensSkipped += 1;
        continue;
      }
    }

    stats.tokensChecked += 1;

    try {
      const report = await analyzeToken(resolveAnalyzeQuery(item), item.chain ?? undefined, {
        forceRefresh: options?.forceRefresh ?? true,
        userId: options?.skipCreditCheck ? undefined : item.userId,
        skipCreditCheck: options?.skipCreditCheck ?? false,
      });

      const newLevel = report.riskLevel;
      const newScore = Math.round(report.scores.overall);
      const previousLevel = item.lastRiskLevel;
      const shouldNotify =
        item.notifyOnChange && isSignificantRiskChange(previousLevel, newLevel);

      await prisma.watchlistItem.update({
        where: { id: item.id },
        data: {
          lastRiskScore: newScore,
          lastRiskLevel: newLevel,
          lastCheckedAt: now,
          ticker: report.ticker ?? item.ticker,
          chain: report.chain ?? item.chain,
        },
      });
      stats.tokensUpdated += 1;

      if (!shouldNotify) {
        continue;
      }

      const label = report.ticker ?? item.ticker ?? item.tokenAddress.slice(0, 10);
      const chainLabel = report.chain ?? item.chain ?? 'unknown';
      const title = 'Watchlist risk change';
      const message = `${label} (${chainLabel}) risk changed from ${previousLevel} to ${newLevel}.`;

      await prisma.notification.create({
        data: {
          userId: item.userId,
          type: 'risk_change',
          title,
          message,
        },
      });
      stats.notificationsCreated += 1;

      const chatId = item.user.telegramChatId;
      if (chatId) {
        const telegramBody = formatWatchlistRiskChangeMessage({
          ticker: label,
          chain: chainLabel,
          newRiskLevel: newLevel,
          oldRiskLevel: previousLevel ?? 'unknown',
          watchlistUrl,
        });
        const sent = await sendTelegramNotification(chatId, telegramBody);
        if (sent) {
          stats.telegramSent += 1;
        }
      }
    } catch (err) {
      if (isInsufficientCreditsError(err)) {
        throw err;
      }
      if (isTokenNotFoundError(err)) {
        await prisma.watchlistItem.update({
          where: { id: item.id },
          data: { lastCheckedAt: now },
        });
      }
      stats.errors += 1;
    }
  }

  return stats;
}
