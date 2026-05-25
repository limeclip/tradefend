'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  initialChatId: string | null;
};

export function TelegramSettings({ initialChatId }: Props) {
  const [chatId, setChatId] = React.useState(initialChatId ?? '');
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    setChatId(initialChatId ?? '');
  }, [initialChatId]);

  async function saveChatId() {
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ telegramChatId: chatId.trim() || null }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string; telegramChatId?: string | null } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Failed to save Telegram settings.');
        return;
      }
      setChatId(json?.telegramChatId ?? '');
      toast.success('Telegram settings saved.');
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim() || undefined }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Test message failed.');
        return;
      }
      toast.success('Test message sent to Telegram.');
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="px-2 tracking-tight text-muted-foreground">Telegram Notifications</div>
      <div className="space-y-4 rounded-2xl border border-border bg-background p-4 dark:bg-[#1c1c1c] dark:border-border/30">
        <div className="space-y-2">
          <Label htmlFor="telegram-chat-id" className="text-sm font-medium text-foreground">
            Telegram chat ID
          </Label>
          <ol className="list-decimal pl-4 text-sm text-muted-foreground space-y-1.5">
            <li>
              Start a chat with our bot:{' '}
              <a
                href="https://t.me/TradefendBot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                @TradefendBot
              </a>{' '}
              and send any message (e.g., <kbd className="rounded bg-muted px-1 py-0.5 font-mono">/start</kbd>).
            </li>
            <li>
              Then open{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                @userinfobot
              </a>
              , click <strong>Start</strong>, and copy the numeric ID it sends you.
            </li>
            <li>
              Paste your numeric ID below and click <strong>Test</strong> – you should receive a test message from @TradefendBot.
            </li>
          </ol>
          <Input
            id="telegram-chat-id"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789"
            className="border-border bg-background"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={testing || !chatId.trim()}
            onClick={() => void sendTest()}
          >
            {testing ? 'Sending…' : 'Test'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={saving}
            onClick={() => void saveChatId()}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </section>
  );
}
