# SEO — HK QR (Free QR Code Generator)

This document covers the on-page SEO implemented in this repo and the steps to
complete **after** the site is deployed.

**Target keywords:** `free qr code generator`, `qr code generator`, `create qr
code for website`, `custom qr code with logo`, `download qr code png`.

---

## 🌐 Domain configuration

The production domain is **`https://freesubqr.vercel.app`**. Search engines will index whatever is in these files, so if it ever changes, update it (with trailing slash) in:

| File | What to replace |
|---|---|
| `index.html` | `canonical` (the source of truth — `og:url`, `og:image`, `twitter:image` derive from the page head) |
| `public/robots.txt` | `Sitemap:` URL (and the comment) |
| `public/sitemap.xml` | `<loc>` URL (and update `<lastmod>`) |
| `scripts/generate-seo-assets.mjs` | `SITE_URL` constant |

Find every occurrence (PowerShell):

```powershell
Select-String -Path index.html,public\robots.txt,public\sitemap.xml,scripts\*.mjs -Pattern "freesubqr"
```

Then regenerate the social image and icons — **the OG image embeds a real QR
code of `SITE_URL`**, so it must be re-encoded for the final domain:

```bash
npm run assets:seo
```

---

## What was implemented (on-page SEO)

### `index.html` (static — visible to crawlers without executing JS)
- **Title tag** with the primary keyword + brand: `Free QR Code Generator – Create & Download QR Codes | HK QR`
- **Meta description** (~155 chars) with a call to action.
- **Canonical URL**, `robots` meta (`index, follow, max-image-preview:large`).
- **Open Graph + Twitter Card** tags (title, description, image1200×630, alt text) — tested preview image generated at `public/og-image.png`.
- **Icons**: SVG favicon + PNG fallback + apple-touch-icon.
- **JSON-LD structured data**: `WebApplication` (with `offers: $0`, feature list) and `FAQPage` mirroring the visible FAQ — injected at build time between the `JSON-LD:START` / `JSON-LD:END` markers by the `seoJsonLd()` Vite plugin (see “Keeping it in sync” below).
- **Fonts moved out of CSS `@import`** into `<link>` tags with `preconnect` — removes a render-blocking round trip (Core Web Vitals / LCP).
- `theme-color` for light and dark modes.

### `src/components/SeoSections.tsx` + `src/data/content.ts` (the app itself)
- **H1 rewritten** from the decorative “Instant Resolution.” to the
  keyword-bearing **“Free QR Code Generator”**, with an SEO-focused sub-headline.
- **Below-the-fold sections** (the biggest ranking lever — the page
  previously had almost no indexable text), rendered from `src/data/content.ts`:
  - `#features` — “Everything a QR code maker should be” + 6 feature cards
  - `#how-it-works` — “How to make a QR code” (3 steps, crawlable ordered list)
  - `#faq` — 6 questions matching the `FAQPage` JSON-LD
- **Site footer** with brand line and internal anchor links.
- **Header nav** now links to `#generator`, `#features`, `#faq` (internal link equity + jump links).
- **Semantic/aria fixes**: `aria-label` on primary nav, `main` landmark with `id="generator"`, descriptive `alt` on the QR image (`QR code for <url>`), `scroll-mt` so anchors don’t hide under the sticky header.
- Layout: the app workspace stays locked to the viewport on desktop
  (`calc(100vh - header - statusbar)`), so the tool UI is unchanged; the new
  content sits directly below it and the page scrolls normally.

### Crawl files
- `public/robots.txt` — allows all crawlers (incl. GPTBot / Google-Extended) and points at the sitemap.
- `public/sitemap.xml` — single-URL sitemap with `lastmod`.

### Assets
- `scripts/generate-seo-assets.mjs` (`npm run assets:seo`) renders
  `favicon.png`, `apple-touch-icon.png` and `og-image.png` (with a real,
  scannable QR of the site URL) using the same `qrcode` library as the app.

---

## After launch checklist

1. **Google Search Console**
   - Verify the property (HTML tag or DNS).
   - Submit `https://your-domain.com/sitemap.xml`.
   - Use URL Inspection → *Request indexing* on the homepage.
2. **Bing Webmaster Tools** — import from GSC (covers Bing, DuckDuckGo, Yandex).
3. **Validate structured data**: <https://search.google.com/test/rich-results> and <https://validator.schema.org>.
4. **Validate social previews**: <https://www.opengraph.xyz>, Facebook Sharing Debugger, <https://cards-dev.twitter.com/validator>.
5. **Core Web Vitals**: run <https://pagespeed.web.dev> — fonts are already
   preconnected; if LCP needs more, preload the primary font file.
6. **Analytics**: add a privacy-friendly tracker (Plausible/Fathom) or GA4 to a
   `GTM`/script block in `index.html`.
7. **Re-run `npm run assets:seo`** after any domain change (see above).

## Keeping it in sync

- All crawlable copy — features, how-to steps, and the FAQ — lives in **one place**: `src/data/content.ts`. `src/components/SeoSections.tsx` renders it on the page, and the **`seoJsonLd()` Vite plugin** (`vite.config.ts`) injects the `WebApplication` and `FAQPage` JSON-LD from the same data at build time, taking the site URL from the canonical tag. Edit `content.ts` once and the visible copy and structured data change together — Google penalizes structured data that doesn’t match visible content, and this setup can’t drift.
- When you add new pages/routes later, add them to `public/sitemap.xml` with a
  unique `<title>` / meta description each.

## Related current setup (app features)

- **Content types**: the generator encodes **URL**, plain **Text**, and **Wi-Fi** payloads (`WIFI:T:...` join strings scannable by phone cameras) — see `src/utils/qrContent.ts`.
- **Exports**: print-ready **PNG** (up to 3000 × 3000 px) and scalable **SVG** (via `src/utils/qrSvg.ts`).
- **Tests & CI**: `npm test` runs the Vitest suite (payload builders, SVG export, components); GitHub Actions (`.github/workflows/ci.yml`) runs `lint → test → build` on pushes and PRs to `main`.
- **Privacy**: Wi-Fi codes are never saved to history (their payload contains the network password), and any previously stored Wi-Fi entries are purged on load. All `localStorage` access goes through try/catch wrappers in `src/utils/storage.ts`.

## Recommended next steps (not implemented)

- **Prerendering / SSG** (e.g. `vite-plugin-ssg` or `react-snap`): meta tags and
  JSON-LD are already static, but the visible copy is client-rendered. Google
  renders JS reliably; weaker crawlers may not. Prerendering removes that risk.
- **Content marketing for backlinks**: a short guide (“how to use QR codes for
  menus / Wi-Fi / business cards”) gives other sites something to link to —
  backlinks are what move a single-page tool up for competitive terms.
- **More landing pages** targeting adjacent keywords (`wifi qr code generator`,
  `qr code for url`, `qr code with logo`) once the core page has authority.
- **i18n + `hreflang`** if you translate the app.
