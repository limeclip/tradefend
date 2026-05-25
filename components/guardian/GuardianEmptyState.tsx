import Link from 'next/link';
import { Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GUARDIAN_CONFIG } from '@/lib/guardian/config';
import type { GuardianStatus } from '@/lib/guardian/types';

type Props = {
  status: GuardianStatus;
};

/**
 * Placeholder empty state for Guardian — Apple-style minimal B&W card.
 * Will be replaced with chat / insights UI in later sub-stages.
 */
export function GuardianEmptyState({ status }: Props) {
  return (
    <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-sm">
      <div
        className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/40"
        aria-hidden
      >
        <Bot className="size-7 text-foreground" strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-lg font-semibold tracking-tight text-foreground">
        {status.enabled ? 'Your guardian is ready' : 'Guardian is coming soon'}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {status.enabled
          ? `${GUARDIAN_CONFIG.displayName} will watch your positions, explain risk changes, and answer questions in plain English.`
          : 'Upgrade to Pro or enable Guardian on your account to unlock your AI trade companion.'}
      </p>
      {!status.enabled ? (
        <Link href="/pricing" className="mt-6 inline-flex">
          <Button className="rounded-2xl">View plans</Button>
        </Link>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          Conversation UI ships in the next release.
        </p>
      )}
    </div>
  );
}
