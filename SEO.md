# SEO — HK QR (Free QR Code Generator)

This document covers the on-page SEO implemented in this repo and the steps to
complete **after** the site is deployed.

**Target keywords:** `free qr code generator`, `qr code generator`, `create qr
code for website`, `custom qr code with logo`, `download qr code png`.

---

## ⚠️ Before deploying: replace the placeholder domain

The site is not deployed yet, so every URL uses the placeholder
**`https://example.com`**. Search engines will index whatever is in these files,
so swap it for your real production URL (with trailing slash) in:

| File | What to replace |
|---|---|
| `index.html` | `canonical`, `og:url`, `og:image`, `twitter:image`, both JSON-LD blocks |
| `public/robots.txt` | `Sitemap:` URL (and the comment) |
| `public/sitemap.xml` | `<loc>` URL (and update `<lastmod>`) |
| `scripts/generate-seo-assets.mjs` | `SITE_URL` constant |

Find every occurrence (PowerShell):

```powershell
Select-String -Path index.html,public\robots.txt,public\sitemap.xml,scripts\*.mjs -Pattern "example.com"
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
- **JSON-LD structured data**: `WebApplication` (with `offers: $0`, feature list) and `FAQPage` mirroring the visible FAQ.
- **Fonts moved out of CSS `@import`** into `<link>` tags with `preconnect` — removes a render-blocking round trip (Core Web Vitals / LCP).
- `theme-color` for light and dark modes.

### `src/App.tsx` (the app itself)
- **H1 rewritten** from the decorative “Instant Resolution.” to the
  keyword-bearing **“Free QR Code Generator”**, with an SEO-focused sub-headline.
- **New below-the-fold sections** (the biggest ranking lever — the page
  previously had almost no indexable text):
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

- The FAQ lives in **two places**: the visible section in `src/App.tsx` and the
  `FAQPage` JSON-LD in `index.html`. Edit both together — Google penalizes
  structured data that doesn’t match visible content.
- When you add new pages/routes later, add them to `public/sitemap.xml` with a
  unique `<title>` / meta description each.

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
