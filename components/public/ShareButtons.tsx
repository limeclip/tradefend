'use client';

import { Check, Copy, Send } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  shareUrl: string;
  ticker: string;
  riskLevel: string;
  className?: string;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareButtons({ shareUrl, ticker, riskLevel, className }: Props) {
  const [copied, setCopied] = React.useState(false);

  const tweetText = `Risk report for ${ticker}: ${riskLevel} risk. Check it on Tradefend`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  const linkClass = cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl px-4 inline-flex items-center cursor-pointer');

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="group" aria-label="Share report">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <XIcon className="mr-2 size-4" />
        Share on X
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <Send className="mr-2 size-4" />
        Telegram
      </a>
      <button type="button" className={linkClass} onClick={() => void copyLink()}>
        {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
        Copy link
      </button>
    </div>
  );
}
