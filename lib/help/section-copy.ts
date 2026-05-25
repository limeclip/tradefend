export type HelpSectionId = 'watchlist' | 'compare' | 'guardian';

export type HelpSectionContent = {
  title: string;
  subtitle: string;
  bullets: string[];
};

export const HELP_SECTIONS: Record<HelpSectionId, HelpSectionContent> = {
  watchlist: {
    title: 'Smart Watchlist',
    subtitle: 'Your personal radar for tokens you care about.',
    bullets: [
      'Track up to 8 tokens on Free (40 on Pro) with live risk scores.',
      'Get in-app and Telegram alerts when risk level changes meaningfully.',
      'Use Check now to run a full analysis and spend one monthly credit — same as a dashboard check.',
      'Refresh all updates every token at once when you want a portfolio-wide snapshot.',
    ],
  },
  compare: {
    title: 'Compare Tokens',
    subtitle: 'Pick the cleaner setup before you commit size.',
    bullets: [
      'Compare 2–5 tokens side by side on liquidity, concentration, volatility, and security.',
      'See AI verdicts for each name in one view — no tab switching.',
      'Ideal when you are choosing between similar narratives or chains.',
      'Each comparison uses your plan credits like a standard risk check.',
    ],
  },
  guardian: {
    title: 'AI Trade Guardian',
    subtitle: 'From risk report to sized position — with discipline built in.',
    bullets: [
      'Safe Position Builder turns a risk report into entry, stop-loss, and take-profit levels.',
      'Save plans, open tracked positions, and monitor deterioration over time.',
      'Weekly Personal Insight summarizes how you researched and what to improve next week.',
      'Pro unlocks higher limits on plans, positions, and unlimited weekly insights.',
    ],
  },
};
