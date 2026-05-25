# PWA icons and OG images

Placeholder assets ship in the repo. Replace them before production launch.

## PWA app icons

1. Prepare a square source image (at least **512×512**, PNG, transparent or solid background).
2. Generate all required sizes with an online tool, for example:
   - [PWA Icon Generator (crawlink)](https://tools.crawlink.com/tools/pwa-icon-generator/)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Replace files under `public/icons/`:
   - `icon-72.png` … `icon-512.png` (see `public/manifest.json` for the full list)
4. If you add or rename sizes, update `public/manifest.json` and `app/layout.tsx` (`apple-touch-icon` currently uses `icon-192.png`).

Current placeholders are copies of `public/logo.png` — swap them for branded icons.

## Web app manifest

- Edit `public/manifest.json` if you change `name`, `short_name`, `theme_color`, or icon paths.
- `theme_color` / `background_color` are static in the manifest; the browser chrome color follows `<meta name="theme-color">`, updated at runtime by `components/ThemeColorSync.tsx`.

## Open Graph images (token pages)

Per-token share images are generated dynamically:

- `app/token/[address]/opengraph-image.tsx` — uses `@vercel/og` via `next/og` (`ImageResponse`)
- Linked from metadata in `lib/token/metadata.ts`

To customize the default OG layout, edit `opengraph-image.tsx` (colors, typography, fields shown).

For a **static** site-wide OG image instead:

1. Add `public/og-image.png` (1200×630 recommended)
2. Point `openGraph.images` in root or token metadata to `/og-image.png`

## Service worker (next-pwa)

Production build generates the service worker:

```bash
npm run build
npm start
```

PWA is disabled in development (`next.config.ts`). Test install/offline behavior against the production server, not `npm run dev`.

Generated files (`public/sw.js`, `public/workbox-*.js`) are gitignored; they appear after `npm run build`.
