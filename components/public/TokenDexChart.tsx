'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface TokenDexChartProps {
  chain?: string;
  tokenAddress: string;
}

export function TokenDexChart({ chain, tokenAddress }: TokenDexChartProps) {
  const { resolvedTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'auto'>('auto');
  const [mounted, setMounted] = useState(false);

  // Определяем фактическую тему (с учётом system)
  useEffect(() => {
    setMounted(true);
    const actualTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    setCurrentTheme(actualTheme);
  }, [resolvedTheme]);

  if (!mounted) {
    // Пока не смонтирован, показываем заглушку с той же высотой
    return <div className="h-[300px] md:h-[580px] w-full rounded-xl bg-muted/30 animate-pulse" />;
  }

  const dexUrl = `https://dexscreener.com/${chain}/${tokenAddress}?embed=1&theme=${currentTheme}`;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <iframe
        src={dexUrl}
        title="DexScreener chart"
        className="h-[300px] w-full md:h-[580px]"
        style={{ border: 'none' }}
        loading="lazy"
        allow="clipboard-write"
      />
    </div>
  );
}