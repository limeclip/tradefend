export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramNotification(chatId: string, message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !chatId.trim()) {
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function formatPositionAlertMessage(params: {
  ticker: string;
  alertKind: 'stop loss' | 'take profit';
  guardianUrl: string;
}): string {
  const ticker = escapeTelegramHtml(params.ticker);
  const kind = escapeTelegramHtml(params.alertKind);
  const url = escapeTelegramHtml(params.guardianUrl);

  return [
    '🚨 <b>Position alert</b>',
    `${ticker} reached your ${kind} level. Consider closing.`,
    `View: ${url}`,
  ].join('\n');
}

export function formatPositionRiskMessage(params: {
  ticker: string;
  newRiskLevel: string;
  oldRiskLevel: string;
  guardianUrl: string;
}): string {
  const ticker = escapeTelegramHtml(params.ticker);
  const newLevel = escapeTelegramHtml(params.newRiskLevel);
  const oldLevel = escapeTelegramHtml(params.oldRiskLevel);
  const url = escapeTelegramHtml(params.guardianUrl);

  return [
    '⚠️ <b>Position risk change</b>',
    `Risk of ${ticker} changed from ${oldLevel} to ${newLevel}. Consider reducing position.`,
    `View: ${url}`,
  ].join('\n');
}

export function formatWatchlistRiskChangeMessage(params: {
  ticker: string;
  chain: string;
  newRiskLevel: string;
  oldRiskLevel: string;
  watchlistUrl: string;
}): string {
  const ticker = escapeTelegramHtml(params.ticker);
  const chain = escapeTelegramHtml(params.chain);
  const newLevel = escapeTelegramHtml(params.newRiskLevel);
  const oldLevel = escapeTelegramHtml(params.oldRiskLevel);
  const url = escapeTelegramHtml(params.watchlistUrl);

  return [
    '⚠️ <b>Risk change in your Watchlist</b>',
    `${ticker} (${chain}) — Risk: ${newLevel} (was ${oldLevel})`,
    `View: ${url}`,
  ].join('\n');
}
