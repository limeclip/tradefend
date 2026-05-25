import type { NextConfig } from 'next';

// next-pwa is CommonJS; wrap the app config for production service worker generation.
// Replace icons in public/icons/ — see docs/pwa-icons.md
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
