import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { Resvg } from "@resvg/resvg-js";
import { generateQrSvg, QUIET_ZONE_MODULES } from "./qrSvg";
import { ErrorCorrectionLevel, LogoConfig } from "../types";

/**
 * Genuine QR decoding verification.
 *
 * PNG round-trip: the real encoder matrix (`QRCode.create`) is rendered to
 * RGBA, encoded to a real PNG via `pngjs`, decoded back to pixels, and run
 * through `jsQR`. The decoder and encoder are never mocked.
 *
 * SVG round-trip: `generateQrSvg` output is rasterized to real pixels with
 * `@resvg/resvg-js` (a native prebuilt SVG renderer — no canvas needed, ships
 * prebuilt binaries for the exact platforms CI runs on, so no compilation),
 * then decoded with `jsQR`. This exercises the actual SVG document,
 * including the painted center badge and its embedded logo image.
 */

type QrEcc = "L" | "M" | "Q" | "H";

function createMatrix(payload: string, errorCorrectionLevel: QrEcc) {
  const qr = QRCode.create(payload, { errorCorrectionLevel });
  return qr.modules as { size: number; get(row: number, col: number): number };
}

/** Renders a QR matrix (+ quiet zone) to an RGBA bitmap. */
function renderMatrix(
  matrix: { size: number; get(row: number, col: number): number },
  options: {
    moduleSize?: number;
    quietZone?: number;
    /** Fraction of the symbol to blank at the centre (simulates a logo). */
    maskCenterRatio?: number;
  } = {},
) {
  const { moduleSize = 4, quietZone = QUIET_ZONE_MODULES, maskCenterRatio = 0 } = options;
  const size = matrix.size;
  const total = size + quietZone * 2;
  const width = total * moduleSize;
  const height = total * moduleSize;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
  }

  const cx = size / 2;
  const cy = size / 2;
  const half = (size * maskCenterRatio) / 2;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let dark = matrix.get(row, col) === 1;
      if (dark && maskCenterRatio > 0) {
        if (col >= cx - half && col < cx + half && row >= cy - half && row < cy + half) {
          dark = false; // centre badge obscures these modules
        }
      }
      if (!dark) continue;
      const ox = (quietZone + col) * moduleSize;
      const oy = (quietZone + row) * moduleSize;
      for (let dy = 0; dy < moduleSize; dy++) {
        for (let dx = 0; dx < moduleSize; dx++) {
          const i = ((oy + dy) * width + (ox + dx)) * 4;
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
        }
      }
    }
  }
  return { data, width, height };
}

/** Encode an RGBA bitmap to a real PNG buffer (pngjs). */
function encodePngBitmap({ data, width, height }: { data: Uint8ClampedArray; width: number; height: number }) {
  return PNG.sync.write({ data, width, height, colorType: 6, inputHasAlpha: true, inputColorType: 6 });
}

/** Decode a PNG buffer back to RGBA pixels (pngjs). */
function decodePngBuffer(buffer: Buffer) {
  const png = PNG.sync.read(buffer);
  return { data: png.data as Uint8ClampedArray, width: png.width, height: png.height };
}

/** Decode QR pixels with jsQR and return the payload. */
function decodeQr(data: Uint8ClampedArray, width: number, height: number): string {
  const result = jsQR(data, width, height);
  if (!result) throw new Error("jsQR failed to decode the QR image");
  return result.data;
}

/** Round trip: matrix -> real PNG -> pixels -> jsQR payload. */
function roundTripPng(payload: string, errorCorrectionLevel: QrEcc, maskCenterRatio = 0): string {
  const matrix = createMatrix(payload, errorCorrectionLevel);
  const bitmap = renderMatrix(matrix, { maskCenterRatio });
  const png = encodePngBitmap(bitmap);
  const decoded = decodePngBuffer(png);
  return decodeQr(decoded.data, decoded.width, decoded.height);
}

describe("genuine QR decoding (png round-trip via jsQR)", () => {
  it("decodes a short URL", () => {
    expect(roundTripPng("https://freesubqr.vercel.app", "M")).toBe("https://freesubqr.vercel.app");
  });

  it("decodes a 242-character URL", () => {
    const payload = "https://example.com/" + "a".repeat(222);
    expect(payload.length).toBe(242);
    expect(roundTripPng(payload, "M")).toBe(payload);
  });

  it("decodes plain text", () => {
    expect(roundTripPng("Meet me at the main entrance at 7pm", "L")).toBe(
      "Meet me at the main entrance at 7pm",
    );
  });

  it("decodes a Wi-Fi join payload", () => {
    expect(roundTripPng("WIFI:T:WPA;S:HomeNetwork;P:hunter2;;", "Q")).toBe(
      "WIFI:T:WPA;S:HomeNetwork;P:hunter2;;",
    );
  });

  it("decodes at every supported error-correction level", () => {
    const payload = "https://freesubqr.vercel.app";
    for (const ecc of ["L", "M", "Q", "H"] as const) {
      expect(roundTripPng(payload, ecc)).toBe(payload);
    }
  });

  it("decodes a QR with a centre logo (level H, masked centre)", () => {
    const payload = "https://freesubqr.vercel.app";
    // Level H (30% redundancy) is what the app forces when a logo is active.
    expect(roundTripPng(payload, "H", 0.22)).toBe(payload);
  });

  it("decodes QRs with every supported centre-logo size ratio (H)", () => {
    const payload = "https://freesubqr.vercel.app";
    // The app allows badge sizes around 0.18–0.26 of the symbol.
    for (const sizeRatio of [0.18, 0.22, 0.26]) {
      expect(roundTripPng(payload, "H", sizeRatio)).toBe(payload);
    }
  });
});

/** A solid-colour PNG data URI used as a stand-in uploaded logo badge image. */
function makeSolidColorDataUri(r: number, g: number, b: number, dimension = 24): string {
  const png = new PNG({ width: dimension, height: dimension });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
  }
  return "data:image/png;base64," + PNG.sync.write(png).toString("base64");
}

const ICON_COLOR = { r: 220, g: 38, b: 38 }; // #dc2626

function makeLogo(shape: LogoConfig["shape"], sizeRatio = 0.22): LogoConfig {
  return {
    enabled: true,
    src: makeSolidColorDataUri(ICON_COLOR.r, ICON_COLOR.g, ICON_COLOR.b),
    type: "upload",
    name: "logo",
    sizeRatio,
    shape,
    paddingRatio: 0.18,
    bgColor: "#ffffff",
  };
}

/**
 * Rasterizes a generated SVG into real RGBA pixels via resvg (the same library
 * class browsers use for SVG rendering; no canvas package required).
 */
function rasterizeSvg(svg: string, outWidth: number) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: outWidth } });
  const pngBuffer = resvg.render().asPng();
  return decodePngBuffer(pngBuffer);
}

describe("genuine QR decoding (SVG rasterized with resvg + jsQR)", () => {
  const base = {
    size: 750,
    qrColor: "#000000",
    bgColor: "#ffffff",
    errorCorrection: "M" as ErrorCorrectionLevel,
  };

  function decodeSvg(svg: string, outWidth = 750): string {
    const { data, width, height } = rasterizeSvg(svg, outWidth);
    return decodeQr(data, width, height);
  }

  it("decodes a short URL from the rasterized SVG", () => {
    const svg = generateQrSvg({ ...base, content: "https://freesubqr.vercel.app" });
    expect(decodeSvg(svg)).toBe("https://freesubqr.vercel.app");
  });

  it("decodes a 242-character URL from the rasterized SVG", () => {
    const payload = "https://example.com/" + "a".repeat(222);
    expect(decodeSvg(generateQrSvg({ ...base, content: payload }))).toBe(payload);
  });

  it("decodes plain text from the rasterized SVG", () => {
    const payload = "Meet me at the main entrance at 7pm";
    expect(decodeSvg(generateQrSvg({ ...base, content: payload }))).toBe(payload);
  });

  it("decodes a Wi-Fi payload from the rasterized SVG", () => {
    const payload = "WIFI:T:WPA;S:HomeNetwork;P:hunter2;;";
    expect(decodeSvg(generateQrSvg({ ...base, content: payload }))).toBe(payload);
  });

  it("decodes SVGs at every supported export size", () => {
    const payload = "https://freesubqr.vercel.app";
    for (const size of [350, 750, 1500, 3000]) {
      const svg = generateQrSvg({ ...base, size, content: payload });
      expect(svg).toContain(`width="${size}"`);
      expect(svg).toContain(`height="${size}"`);
      expect(decodeSvg(svg, size)).toBe(payload);
    }
  }, 180_000);

  it("decodes SVGs at every error-correction level", () => {
    const payload = "https://freesubqr.vercel.app";
    for (const ecc of ["L", "M", "Q", "H"] as const) {
      expect(decodeSvg(generateQrSvg({ ...base, errorCorrection: ecc, content: payload }))).toBe(
        payload,
      );
    }
  });

  it("paints the centre badge and keeps the payload decodable — rounded badge", () => {
    const payload = "https://freesubqr.vercel.app";
    const svg = generateQrSvg({
      ...base,
      errorCorrection: "H",
      content: payload,
      logo: makeLogo("rounded"),
    });
    // The badge image must actually reach the rasterized pixels: the centre of
    // the export is the icon colour, not the QR dark colour.
    const center = rasterizeSvg(svg, 750);
    const mid = Math.floor(750 / 2);
    const idx = (mid * 750 + mid) * 4;
    expect([center.data[idx], center.data[idx + 1], center.data[idx + 2]]).toEqual([
      ICON_COLOR.r, ICON_COLOR.g, ICON_COLOR.b,
    ]);
    expect(decodeSvg(svg)).toBe(payload);
  });

  it("paints the centre badge and keeps the payload decodable — circular badge", () => {
    const payload = "https://freesubqr.vercel.app";
    const svg = generateQrSvg({
      ...base,
      errorCorrection: "H",
      content: payload,
      logo: makeLogo("circle"),
    });
    const center = rasterizeSvg(svg, 750);
    const mid = Math.floor(750 / 2);
    const idx = (mid * 750 + mid) * 4;
    expect([center.data[idx], center.data[idx + 1], center.data[idx + 2]]).toEqual([
      ICON_COLOR.r, ICON_COLOR.g, ICON_COLOR.b,
    ]);
    expect(decodeSvg(svg)).toBe(payload);
  });

  it("paints the centre badge and keeps the payload decodable — square badge", () => {
    const payload = "https://freesubqr.vercel.app";
    const svg = generateQrSvg({
      ...base,
      errorCorrection: "H",
      content: payload,
      logo: makeLogo("square"),
    });
    const center = rasterizeSvg(svg, 750);
    const mid = Math.floor(750 / 2);
    const idx = (mid * 750 + mid) * 4;
    expect([center.data[idx], center.data[idx + 1], center.data[idx + 2]]).toEqual([
      ICON_COLOR.r, ICON_COLOR.g, ICON_COLOR.b,
    ]);
    expect(decodeSvg(svg)).toBe(payload);
  });

  it("decodes SVGs with every supported centre-logo size ratio (H)", () => {
    const payload = "https://freesubqr.vercel.app";
    for (const sizeRatio of [0.18, 0.22, 0.26]) {
      const svg = generateQrSvg({
        ...base,
        errorCorrection: "H",
        content: payload,
        logo: makeLogo("rounded", sizeRatio),
      });
      expect(decodeSvg(svg)).toBe(payload);
    }
  });

  it("scales the viewBox with the payload and applies a four-module quiet zone", () => {
    const short = generateQrSvg({ ...base, content: "a" });
    const long = generateQrSvg({ ...base, content: "a".repeat(400) });
    const shortBox = Number(short.match(/viewBox="0 0 (\d+) (\d+)"/)?.[1] ?? 0);
    const longBox = Number(long.match(/viewBox="0 0 (\d+) (\d+)"/)?.[1] ?? 0);
    expect(longBox).toBeGreaterThan(shortBox);
    expect(QUIET_ZONE_MODULES).toBe(4);
    // The quiet zone is part of the viewBox on both sides.
    expect(longBox).toBeGreaterThan(QUIET_ZONE_MODULES * 2);
  });
});
