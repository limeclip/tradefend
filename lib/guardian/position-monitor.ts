import { getAppUrl } from '@/lib/app-url';
import { fetchDexScreenerTokenPriceUsd } from '@/lib/guardian/dex-price';
import { isPriceAtOrAbove, isPriceAtOrBelow } from '@/lib/guardian/position-prices';
import { prisma } from '@/lib/prisma';
import {
  formatPositionAlertMessage,
  formatPositionRiskMessage,
  sendTelegramNotification,
} from '@/lib/telegram/send';

const RISK_RANK: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export type PositionMonitorStats = {
  positionsChecked: number;
  priceAlerts: number;
  riskAlerts: number;
  notificationsCreated: number;
  telegramSent: number;
  errors: number;
};

export type UserPositionForMonitor = {
  id: string;
  userId: string;
  tokenAddress: string;
  ticker: string | null;
  chain: string | null;
  stopLossPrice: number;
  takeProfitPrice: number;
  lastRiskLevel: string | null;
  user: {
    telegramChatId: string | null;
  };
};

function isRiskWorsening(previous: string | null | undefined, current: string): boolean {
  if (!previous || previous === current) return false;
  const prevRank = RISK_RANK[previous.toUpperCase()];
  const nextRank = RISK_RANK[current.toUpperCase()];
  if (prevRank === undefined || nextRank === undefined) return false;
  return nextRank > prevRank;
}

async function resolvePriceUsd(position: UserPositionForMonitor): Promise<number | null> {
  return fetchDexScreenerTokenPriceUsd(position.tokenAddress);
}

export async function runPositionMonitor(
  positions: UserPositionForMonitor[],
): Promise<PositionMonitorStats> {
  const stats: PositionMonitorStats = {
    positionsChecked: 0,
    priceAlerts: 0,
    riskAlerts: 0,
    notificationsCreated: 0,
    telegramSent: 0,
    errors: 0,
  };

  const guardianUrl = `${getAppUrl()}/guardian`;

  for (const position of positions) {
    stats.positionsChecked += 1;

    try {
      const watchlistItem = await prisma.watchlistItem.findUnique({
        where: {
          userId_tokenAddress: {
            userId: position.userId,
            tokenAddress: position.tokenAddress,
          },
        },
        select: {
          lastRiskLevel: true,
          lastRiskScore: true,
          ticker: true,
        },
      });

      const priceUsd = await resolvePriceUsd(position);
      const label = position.ticker ?? watchlistItem?.ticker ?? position.tokenAddress.slice(0, 10);

      if (priceUsd !== null && priceUsd > 0) {
        await prisma.userPosition.update({
          where: { id: position.id },
          data: { lastPriceUsd: priceUsd },
        });

        let alertKind: 'stop loss' | 'take profit' | null = null;
        if (isPriceAtOrBelow(priceUsd, position.stopLossPrice)) {
          alertKind = 'stop loss';
        } else if (isPriceAtOrAbove(priceUsd, position.takeProfitPrice)) {
          alertKind = 'take profit';
        }

        if (alertKind) {
          const title = 'Position alert';
          const message = `🚨 Position alert: ${label} reached your ${alertKind} level. Consider closing.`;

          await prisma.notification.create({
            data: {
              userId: position.userId,
              type: 'position_alert',
              title,
              message,
            },
          });
          stats.notificationsCreated += 1;
          stats.priceAlerts += 1;

          const chatId = position.user.telegramChatId;
          if (chatId) {
            const body = formatPositionAlertMessage({
              ticker: label,
              alertKind,
              guardianUrl,
            });
            if (await sendTelegramNotification(chatId, body)) {
              stats.telegramSent += 1;
            }
          }
        }
      }

      const currentRisk = watchlistItem?.lastRiskLevel ?? null;
      if (currentRisk && isRiskWorsening(position.lastRiskLevel, currentRisk)) {
        const title = 'Position risk change';
        const message = `⚠️ Risk of ${label} position changed to ${currentRisk}. Consider reducing position.`;

        await prisma.notification.create({
          data: {
            userId: position.userId,
            type: 'position_alert',
            title,
            message,
          },
        });
        stats.notificationsCreated += 1;
        stats.riskAlerts += 1;

        const chatId = position.user.telegramChatId;
        if (chatId) {
          const body = formatPositionRiskMessage({
            ticker: label,
            newRiskLevel: currentRisk,
            oldRiskLevel: position.lastRiskLevel ?? 'unknown',
            guardianUrl,
          });
          if (await sendTelegramNotification(chatId, body)) {
            stats.telegramSent += 1;
          }
        }
      }

      if (currentRisk) {
        await prisma.userPosition.update({
          where: { id: position.id },
          data: { lastRiskLevel: currentRisk },
        });
      }
    } catch {
      stats.errors += 1;
    }
  }

  return stats;
}
