/**
 * Single source of truth for the crawlable marketing copy.
 *
 * The page (src/components/SeoSections.tsx) and the JSON-LD structured data
 * injected into index.html by the `seoJsonLd()` plugin in vite.config.ts both
 * read from this file — edit copy here once and both stay in sync.
 */

export interface FeatureItem {
  id: string;
  title: string;
  body: string;
}

export interface StepItem {
  step: string;
  title: string;
  body: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Feature grid — also exposed as the JSON-LD `featureList`. */
export const FEATURES: FeatureItem[] = [
  {
    id: "01",
    title: "High-resolution PNG export",
    body: "Four export sizes from 350px for the web up to 3000 × 3000 px for posters and billboards, rendered sharply at full resolution.",
  },
  {
    id: "02",
    title: "Full color control",
    body: "Six foreground presets, four background presets and a custom color picker for both layers — match your brand and keep the code scannable.",
  },
  {
    id: "03",
    title: "Logos & center icons",
    body: "Drop your own image in the center or pick a preset badge. Error correction automatically switches to level H so the code stays readable.",
  },
  {
    id: "04",
    title: "Scan reliability",
    body: "Switch between error correction levels L, M, Q and H (7%–30% redundancy) and let the ISO/IEC 18004 encoder do the rest.",
  },
  {
    id: "05",
    title: "Free & unlimited",
    body: "No signup, no watermarks, no generation limits. Create as many QR codes as you need, as often as you need.",
  },
  {
    id: "06",
    title: "Private by design",
    body: "Codes are generated entirely in your browser. Recent codes stay in local storage and can be cleared with one click.",
  },
];

/** "How to make a QR code" steps. */
export const HOW_IT_STEPS: StepItem[] = [
  {
    step: "01",
    title: "Paste your link",
    body: "Enter any destination URL in the Source Destination URL field. Leave off the protocol and https:// is added automatically.",
  },
  {
    step: "02",
    title: "Customize your code",
    body: "Pick colors, export size and error correction level, then add a center logo or preset icon if you want.",
  },
  {
    step: "03",
    title: "Download or share",
    body: "Save a print-ready PNG or a scalable SVG, copy the code to your clipboard, or share it straight from your device.",
  },
];

/** FAQ — also emitted as the JSON-LD `FAQPage` mainEntity. */
export const FAQS: FaqItem[] = [
  {
    q: "How do I make a QR code for my website?",
    a: "Paste your website URL into the Source Destination URL field, adjust colors, size and error correction if you want, then hit Download. Your QR code is generated instantly as a print-ready PNG.",
  },
  {
    q: "Are these QR codes free?",
    a: "Yes. FREESUBQR is free with no signup, no watermarks and no limit on how many codes you generate.",
  },
  {
    q: "Can I customize QR code colors and add a logo?",
    a: "Yes. Choose from preset foreground and background colors or pick any custom color, and place a preset icon or your own uploaded image in the center. When a logo is enabled, error correction is automatically raised to level H so the code still scans.",
  },
  {
    q: "What size should a QR code be?",
    a: "For print, keep the code at least 2–3 cm (about 1 inch) wide, and larger for posters or billboards. For screens, 350px is enough for web use. The generator offers Small Print, Medium Card, Large Poster and Ultra Crisp presets up to 3000 × 3000 px.",
  },
  {
    q: "Do QR codes expire?",
    a: "No. These are static QR codes encoded directly into the image, so they never expire and work without an internet connection on the scanning side. They always point to the URL you encoded.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "No. QR codes are generated entirely in your browser. Recent codes are kept only in your browser's local storage and can be cleared at any time from the History panel.",
  },
];

const APP_NAME = "FREESUBQR – Free QR Code Generator";
const APP_DESCRIPTION =
  "Free online QR code generator. Create, customize and download high-resolution QR codes for any URL — colors, logos, error correction and print-ready PNG export up to 3000px. No signup required.";

/**
 * `WebApplication` structured data. `siteUrl` must be absolute and should end
 * with a trailing slash (read from the canonical tag by the Vite plugin).
 */
export function buildWebApplicationJsonLd(siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: APP_NAME,
    url: siteUrl,
    image: new URL("og-image.png", siteUrl).toString(),
    description: APP_DESCRIPTION,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: FEATURES.map((feature) => feature.title),
  };
}

/** `FAQPage` structured data, generated from the same FAQ the page renders. */
export function buildFaqPageJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
