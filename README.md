# HK QR — Free QR Code Generator

A fast, private, browser-only QR code generator. Paste a link, style the code, add a logo, and export a print-ready PNG up to **3000 × 3000 px** — no signup, no watermarks, no uploads.

![HK QR preview](public/og-image.png)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [How it works](#how-it-works)
- [Customization](#customization)
- [SEO](#seo)
- [Deployment](#deployment)
- [Privacy](#privacy)
- [Browser support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### QR generation

- **Any URL or text** — paste a full URL or a bare domain; `https://` is added automatically when a protocol is missing.
- **Live preview** — the QR code regenerates as you type, with a subtle progress indicator while the matrix is compiled.
- **URL validation** — a visual indicator confirms a valid URL structure and offers one-click test presets (Google, GitHub, Wikipedia, AI Studio).

### Styling

- **Foreground colors** — 6 presets (Obsidian, Cobalt Blue, Emerald Green, Crimson Red, Amethyst, Amber Orange) plus a native color picker.
- **Background colors** — 4 presets (White, Alabaster, Soft Cream, Ice Cyan) plus a native color picker.
- **Export sizes** — 350 px (web), 750 px (print standard), 1500 px (poster), and 3000 px (billboard) square PNGs.
- **Error correction** — ISO/IEC 18004 levels L (7%), M (15%), Q (25%), and H (30%).
- **Dark and light UI themes** — persisted in local storage and initialized from the OS preference.

### Logos and center badges

- **13 built-in vector icons** — Globe, Link, Star, Heart, Magic, Shield, Wi-Fi, Mail, Coffee, Store, GitHub, YouTube, and Instagram.
- **Custom upload** — drag and drop or browse for PNG, JPG, SVG, or WebP files up to 5 MB.
- **Badge controls** — rounded, circle, or square shape; compact (18%), default (22%), or prominent (26%) size.
- **Badge theming** — match the pattern background or force white/black, and choose an icon tone that always keeps contrast.
- **Automatic safety** — enabling a logo automatically raises error correction to **level H**, so the code stays scannable.

### Export and sharing

- **Download PNG** — filenames are derived from the destination hostname (for example `github_matrix_750x750.png`).
- **Copy to clipboard** — copies the PNG image directly; falls back to copying the URL text when image clipboard access is unavailable.
- **Web Share API** — shares the image file where supported, then falls back to sharing the link, then to copying it.

### History and privacy

- **Recent history** — the last 5 generated codes are stored in `localStorage` with their colors, size, error correction, and logo settings.
- **Restore in one click** — click any history item to reload its exact configuration.
- **Per-item actions** — copy or share the destination link, remove a single entry, or clear the entire history.
- **Fully local** — QR codes are generated in the browser with Canvas. Nothing is sent to a server.

### SEO and accessibility

- Static metadata, Open Graph/Twitter cards, canonical URL, and JSON-LD (`WebApplication` + `FAQPage`).
- Crawlable below-the-fold content: feature grid, how-to steps, and FAQ.
- Semantic landmarks, ARIA labels, keyboard-closable history drawer, and descriptive image alt text.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI | [React 19](https://react.dev/) + TypeScript |
| Build tool | [Vite 6](https://vite.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) via `@tailwindcss/vite` |
| QR encoding | [`qrcode`](https://www.npmjs.com/package/qrcode) |
| Icons | [`lucide-react`](https://lucide.dev/) |
| Animation | [`motion`](https://motion.dev/) |
| SEO asset generation | Node.js + [`pngjs`](https://www.npmjs.com/package/pngjs) |

> The app itself is a static client-side SPA. `express`, `dotenv`, and `@google/genai` remain in `package.json` from the original AI Studio scaffold but are **not imported or required at runtime**.

---

## Project structure

```text
qr/
├── index.html                     # HTML shell, meta tags, OG/Twitter cards, JSON-LD
├── metadata.json                  # AI Studio app metadata
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite + React + Tailwind plugins
├── .env.example                   # AI Studio environment template (unused by the app)
├── SEO.md                         # SEO implementation notes and launch checklist
├── README.md
├── public/
│   ├── favicon.svg                # Scalable brand favicon
│   ├── favicon.png                # 64×64 PNG fallback
│   ├── apple-touch-icon.png       # 180×180 iOS icon
│   ├── og-image.png               # 1200×630 social preview with a real QR code
│   ├── robots.txt                 # Crawler rules + sitemap reference
│   └── sitemap.xml                # Single-URL sitemap
├── scripts/
│   └── generate-seo-assets.mjs    # Regenerates favicon, touch icon, and OG image
└── src/
    ├── main.tsx                   # React entry point
    ├── index.css                  # Tailwind import, theme fonts, scrollbar styles
    ├── App.tsx                    # Main UI, state, generation, export, SEO sections
    ├── types.ts                   # Shared TypeScript interfaces
    ├── components/
    │   ├── LogoSelector.tsx       # Preset icons, upload, badge shape/size/color controls
    │   └── HistorySidebar.tsx     # Recent history slide-over drawer
    └── utils/
        ├── qrGenerator.ts         # QR encoding + center badge canvas compositing
        └── presetLogos.ts         # Preset SVG definitions and contrast helpers
```

---

## Getting started

### Prerequisites

- **Node.js 20 LTS or newer** (Vite 6 requires Node 18+; 20 LTS is recommended)
- npm (or pnpm/yarn/bun — the repo ships a `package-lock.json`)

### Install and run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server on http://localhost:3000
npm run dev
```

No API key or `.env` file is needed — generation is entirely client-side. The variables in `.env.example` (`GEMINI_API_KEY`, `APP_URL`) are leftovers from the AI Studio scaffold and are not read by this app.

### Production build

```bash
npm run build     # outputs static files to dist/
npm run preview   # serves the production build locally
```

---

## Available scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite --port=3000 --host=0.0.0.0` | Start the dev server on port 3000, exposed on the network |
| `build` | `vite build` | Create an optimized production build in `dist/` |
| `preview` | `vite preview` | Preview the production build locally |
| `lint` | `tsc --noEmit` | Type-check the project without emitting files |
| `assets:seo` | `node scripts/generate-seo-assets.mjs` | Regenerate favicon, Apple touch icon, and OG image |
| `clean` | `rm -rf dist server.js` | Remove build artifacts (requires a POSIX-compatible shell) |

There is no test suite configured.

---

## How it works

### Generation pipeline

1. **Input normalization** — `App.tsx` checks whether the input already starts with `http://` or `https://`. If not, and the input contains a dot, `https://` is prefixed.
2. **Matrix encoding** — `generateQrCode()` in `src/utils/qrGenerator.ts` calls `QRCode.toDataURL()` with the selected size, colors, margin (`3` modules), and error-correction level.
3. **Logo compositing** — when a logo is active, a canvas of the requested size is created, the base QR is drawn onto it, and a badge is rendered in the center:
   - The badge background clears the modules underneath.
   - The shape is drawn as a circle, rounded rectangle, or square with a high-contrast hairline border.
   - The icon is aspect-fit and clipped to the badge shape.
4. **Result** — the canvas is exported as a PNG data URL and rendered in the preview. Errors are surfaced in the UI instead of failing silently.

### Error correction and logos

A logo covers part of the matrix, so the encoder automatically uses **level H (30% redundancy)** whenever a logo is enabled. This happens in two places:

- `handleLogoChange()` in `App.tsx`, which updates the visible setting.
- `generateQrCode()`, which enforces it again at encode time as a safety net.

### Persistence

| Key | Contents |
|---|---|
| `hk_qr_theme` | `"light"` or `"dark"` |
| `hk_qr_history` | JSON array of up to 5 `QrHistoryItem` objects |

History entries store the URL, timestamp, foreground/background colors, size, error-correction level, and full logo configuration. The initial state contains one seeded entry pointing at `https://ai.studio/build` until the user generates their own codes.

### Contrast helpers

`src/utils/presetLogos.ts` includes:

- `getLuminance(hex)` — perceptual luminance from a hex color.
- `getHighContrastColor(bg, desired?)` — keeps the requested color when the luminance difference is at least `0.3`, otherwise returns black or white.
- `resolvePresetIconColor()` — picks a safe icon color from the badge background, the user's preference, or the matrix color.
- `createPresetSvgDataUri()` — builds an inline SVG data URI for preset icons.

---

## Customization

### Adding a preset logo

1. Add an entry to `PRESET_LOGOS` in `src/utils/presetLogos.ts` with a unique `id`, `name`, `type` (`"stroke"` or `"fill"`), `viewBox`, and inner SVG `elements`.
2. It appears automatically in the `LogoSelector` grid — no other changes required.

### Changing colors or sizes

Preset palettes and export sizes are constants at the top of `src/App.tsx`:

- `FOR_COLOR_PRESETS` — foreground swatches
- `BACK_COLOR_PRESETS` — background swatches
- `SIZE_PRESETS` — export dimensions
- `TEST_PRESETS` — quick URL examples

### Fonts and theme

Fonts are loaded in `index.html` (with `preconnect`) and mapped to Tailwind tokens in `src/index.css`:

- `--font-sans`: Inter
- `--font-display`: Outfit
- `--font-mono`: JetBrains Mono

Dark mode uses the `dark` class on `<html>` via `@custom-variant dark`.

---

## SEO

The repository ships with a complete on-page SEO setup. Before deploying, **replace every `https://example.com` placeholder** with your real production URL (including the trailing slash).

Files that contain the placeholder:

| File | What to update |
|---|---|
| `index.html` | `canonical`, `og:url`, `og:image`, `twitter:image`, both JSON-LD blocks |
| `public/robots.txt` | `Sitemap:` URL and the comment |
| `public/sitemap.xml` | `<loc>` and `<lastmod>` |
| `scripts/generate-seo-assets.mjs` | `SITE_URL` constant |

Find them all:

```powershell
Select-String -Path index.html,public\robots.txt,public\sitemap.xml,scripts\*.mjs -Pattern "example.com"
```

Then regenerate the social image and icons — the OG image embeds a real QR code of `SITE_URL`:

```bash
npm run assets:seo
```

> **Important:** the FAQ exists in two places — the visible section in `src/App.tsx` and the `FAQPage` JSON-LD in `index.html`. Keep them in sync; Google penalizes structured data that does not match visible content.

See [`SEO.md`](SEO.md) for the full pre-launch and post-launch checklist (Search Console, Bing, rich results, social previews, Core Web Vitals).

---

## Deployment

The build output in `dist/` is fully static and can be hosted anywhere:

- Netlify, Vercel, Cloudflare Pages, GitHub Pages
- Amazon S3 + CloudFront
- Nginx, Apache, or any static file server

```bash
npm ci
npm run build
# deploy the contents of dist/
```

Notes:

- The app is a single page with no client-side router, so no SPA rewrite rules are required.
- If you deploy under a subpath (for example `https://example.com/qr/`), set Vite's [`base`](https://vite.dev/config/shared-options.html#base) option in `vite.config.ts` and update the absolute asset paths in `index.html`.
- Remember to update the placeholder domain and rerun `npm run assets:seo` before the first deploy.

---

## Privacy

- QR codes are generated locally with the Canvas API; no content is uploaded.
- The only persisted data is the theme preference and up to five recent history entries, both in `localStorage`.
- History can be cleared at any time from the History drawer.
- There are no analytics or tracking scripts in the project by default.

---

## Browser support

Modern evergreen browsers:

| Feature | Requirement |
|---|---|
| App | Chrome, Edge, Firefox, Safari (current versions) |
| PNG download | `<a download>` support |
| Copy image | Clipboard API with `ClipboardItem` (falls back to copying the URL) |
| Share image | Web Share API Level 2 (falls back to sharing/copying the URL) |
| Canvas badge rendering | `CanvasRenderingContext2D`, with a `roundRect` fallback |

---

## Troubleshooting

**The dev server is not reachable on port 3000.**
Another process may be using the port. Stop it or run `npx vite --port 3001`.

**`npm run clean` fails on Windows.**
The script uses `rm -rf`, which needs Git Bash, WSL, or a POSIX shell. Delete `dist/` manually or run it from Git Bash.

**The logo does not appear in the exported PNG.**
Make sure the image is under 5 MB and is a PNG, JPG, SVG, or WebP file. Cross-origin images can taint the canvas; upload the file instead of linking to a remote URL.

**The QR code will not scan after heavy customization.**
Keep a strong contrast between foreground and background, avoid very light foreground colors, and leave a quiet zone around the code. When a logo is enabled, level H is enforced automatically.

**Social previews show the placeholder domain.**
Update `https://example.com` in `index.html`, then run `npm run assets:seo` and redeploy.

**Type errors after changing dependencies.**
Run `npm run lint` (`tsc --noEmit`) to see the full diagnostics.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-change`.
3. Make your changes and run `npm run lint` and `npm run build`.
4. Open a pull request with a clear description of the change.

Please keep the existing design language, TypeScript types, and accessibility attributes consistent with the rest of the codebase.

---

## License

Source files carry the **Apache-2.0** SPDX identifier (`SPDX-License-Identifier: Apache-2.0`) in their headers. Add a `LICENSE` file if you plan to redistribute the project.

---

## Acknowledgements

- [qrcode](https://github.com/soldair/node-qrcode) for QR encoding
- [Lucide](https://lucide.dev/) for the icon set
- [Motion](https://motion.dev/) for animations
- [Tailwind CSS](https://tailwindcss.com/) and [Vite](https://vite.dev/) for the toolchain
