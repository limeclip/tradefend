'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

/** Keeps `<meta name="theme-color">` in sync with light/dark theme for PWA chrome. */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) return;

    const isDark =
      resolvedTheme === 'dark' ||
      document.documentElement.classList.contains('dark');
    themeColorMeta.setAttribute('content', isDark ? '#000000' : '#ffffff');
  }, [resolvedTheme]);

  return null;
}
