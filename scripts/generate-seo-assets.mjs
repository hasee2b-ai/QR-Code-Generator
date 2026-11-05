/**
 * Generates SEO/social image assets into public/:
 *   - favicon.png          (64x64)   – browser fallback for the SVG favicon
 *   - apple-touch-icon.png (180x180) – iOS home screen icon
 *   - og-image.png         (1200x630)- Open Graph / Twitter card preview
 *
 * The OG image embeds a REAL QR code pointing at SITE_URL, so scanning the
 * shared image opens the site.
 *
 * Run with: npm run assets:seo
 * If you change SITE_URL, re-run this script (see SEO.md).
 */
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

// ⚠️ Keep in sync with the canonical/og:url in index.html.
const SITE_URL = "https://freesubqr.vercel.app";

const PUBLIC_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public"
);

// Brand palette (matches the light theme of the app)
const INK = [10, 10, 10, 255]; // #0a0a0a
const PAPER = [255, 255, 255, 255];
const CANVAS_BG = [250, 250, 250, 255]; // neutral-50

/* ------------------------------------------------------------------ */
/* Minimal 5x7 bitmap font (uppercase only)                            */
/* ------------------------------------------------------------------ */
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

/* ------------------------------------------------------------------ */
/* Tiny RGBA canvas helpers                                            */
/* ------------------------------------------------------------------ */
function createCanvas(width, height, bg) {
  const data = Buffer.alloc(width * height * 4);
  const png = new PNG({ width, height });
  png.data = data;
  if (bg) fillRect(png, 0, 0, width, height, bg);
  return png;
}

function setPixel(png, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(png, xx, yy, color);
  }
}

function strokeRect(png, x, y, w, h, thickness, color) {
  fillRect(png, x, y, w, thickness, color);
  fillRect(png, x, y + h - thickness, w, thickness, color);
  fillRect(png, x, y, thickness, h, color);
  fillRect(png, x + w - thickness, y, thickness, h, color);
}

/** Subtle dotted grid decoration, matching the app's background. */
function drawDotGrid(png, step, radius, color) {
  for (let y = radius; y < png.height; y += step) {
    for (let x = radius; x < png.width; x += step) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) setPixel(png, x + dx, y + dy, color);
        }
      }
    }
  }
}

/** Draws text with the 5x7 font. Returns the total width drawn. */
function drawText(png, text, x, y, scale, color) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    const glyph = FONT[char];
    if (!glyph) continue;
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === "1") {
          fillRect(png, cursor + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += (glyph[0].length + 1) * scale;
  }
  return cursor - x - scale;
}

function textWidth(text, scale) {
  return text.length * (5 + 1) * scale - scale;
}

/** Brand mark: black tile with a white outlined square (matches the header logo). */
function drawBrandMark(png, x, y, size) {
  const s = (n) => Math.round((n * size) / 64);
  fillRect(png, x, y, size, size, INK);
  strokeRect(png, x + s(14), y + s(14), s(36), s(36), Math.max(2, s(6)), PAPER);
  fillRect(png, x + s(28), y + s(28), Math.max(2, s(8)), Math.max(2, s(8)), PAPER);
}

function writePng(png, filename) {
  const file = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(`✓ public/${filename} (${png.width}x${png.height})`);
}

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */
async function generate() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // --- Favicon (64x64) ---
  const favicon = createCanvas(64, 64, INK);
  drawBrandMark(favicon, 0, 0, 64);
  writePng(favicon, "favicon.png");

  // --- Apple touch icon (180x180) ---
  const apple = createCanvas(180, 180, INK);
  drawBrandMark(apple, 0, 0, 180);
  writePng(apple, "apple-touch-icon.png");

  // --- Open Graph image (1200x630) ---
  const W = 1200;
  const H = 630;
  const og = createCanvas(W, H, CANVAS_BG);
  drawDotGrid(og, 24, 1, [10, 10, 10, 14]);

  // QR panel (left), with the app's signature hard offset shadow
  const panel = { x: 80, y: 85, size: 460, border: 10, padding: 36 };
  fillRect(og, panel.x + 16, panel.y + 16, panel.size, panel.size, [10, 10, 10, 40]);
  fillRect(og, panel.x, panel.y, panel.size, panel.size, PAPER);
  strokeRect(og, panel.x, panel.y, panel.size, panel.size, panel.border, INK);

  const qr = await QRCode.create(SITE_URL, { errorCorrectionLevel: "M" });
  const modules = qr.modules;
  const inner = panel.size - panel.border * 2 - panel.padding * 2;
  const cell = Math.floor(inner / modules.size);
  const qrSize = cell * modules.size;
  const qrX = panel.x + panel.border + Math.round((panel.size - panel.border * 2 - qrSize) / 2);
  const qrY = panel.y + panel.border + Math.round((panel.size - panel.border * 2 - qrSize) / 2);
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        fillRect(og, qrX + col * cell, qrY + row * cell, cell, cell, INK);
      }
    }
  }

  // Typography (right)
  const tx = 620;
  drawBrandMark(og, tx, 96, 56);
  drawText(og, "FREESUBQR", tx, 196, 16, INK);
  fillRect(og, tx, 336, textWidth("FREESUBQR", 16), 8, INK);
  drawText(og, "FREE QR CODE", tx, 384, 7, INK);
  drawText(og, "GENERATOR", tx, 444, 7, INK);

  writePng(og, "og-image.png");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
