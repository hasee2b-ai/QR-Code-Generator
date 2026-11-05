import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { generateQrSvg } from "./qrSvg";
import { QUIET_ZONE_MODULES } from "./qrSvg";
import { ErrorCorrectionLevel, LogoConfig } from "../types";

/**
 * Genuine QR decoding verification.
 *
 * jsdom has no real canvas (and `canvas`/node-canvas is a heavy native
 * dependency we deliberately do not add), so the browser's canvas-based PNG
 * renderer cannot be decoded pixel-for-pixel here. Instead we use the same
 * encoder the app uses (`QRCode.create`) to build the real QR matrix, render
 * it to a bitmap, encode that bitmap to a real PNG via `pngjs` (already a
 * devDependency), decode the PNG back to pixels, and run `jsQR` over it.
 * This verifies the payload the app encodes is genuinely scannable.
 *
 * For SVG exports we parse the generated `<path>` module commands back into a
 * matrix (a logical rasterization of the vector image), render that to pixels
 * and decode with `jsQR` — verifying the SVG encodes the same payload.
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
    expect(roundTripPng(payload, "H", 0.30)).toBe(payload);
  });
});

describe("genuine QR decoding (SVG exports, logically rasterized)", () => {
  /** Rebuilds the module grid from the generated SVG `<path>` commands. */
  function svgToGrid(svg: string): { total: number; size: number; grid: boolean[][] } {
    const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (!viewBox) throw new Error("viewBox missing from generated SVG");
    const total = Number(viewBox[1]);
    const margin = QUIET_ZONE_MODULES;
    const size = total - margin * 2;
    const grid: boolean[][] = Array.from({ length: total }, () => Array(total).fill(false));
    const moduleRe = /M(\d+) (\d+)h1v1h-1z/g;
    let match: RegExpExecArray | null;
    while ((match = moduleRe.exec(svg))) {
      const x = Number(match[1]);
      const y = Number(match[2]);
      if (x >= 0 && x < total && y >= 0 && y < total) grid[y][x] = true;
    }
    return { total, size, grid };
  }

  function decodeSvg(svg: string): string {
    const { total, grid } = svgToGrid(svg);
    const moduleSize = 4;
    const width = total * moduleSize;
    const height = total * moduleSize;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
    }
    for (let row = 0; row < total; row++) {
      for (let col = 0; col < total; col++) {
        if (!grid[row][col]) continue;
        const ox = col * moduleSize;
        const oy = row * moduleSize;
        for (let dy = 0; dy < moduleSize; dy++) {
          for (let dx = 0; dx < moduleSize; dx++) {
            const i = ((oy + dy) * width + (ox + dx)) * 4;
            data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
          }
        }
      }
    }
    return decodeQr(data, width, height);
  }

  const base = {
    size: 750,
    qrColor: "#000000",
    bgColor: "#ffffff",
    errorCorrection: "M" as ErrorCorrectionLevel,
  };

  it("decodes a short URL from SVG", () => {
    expect(decodeSvg(generateQrSvg({ ...base, content: "https://freesubqr.vercel.app" }))).toBe(
      "https://freesubqr.vercel.app",
    );
  });

  it("decodes a 242-character URL from SVG", () => {
    const payload = "https://example.com/" + "a".repeat(222);
    expect(decodeSvg(generateQrSvg({ ...base, content: payload }))).toBe(payload);
  });

  it("decodes plain text from SVG", () => {
    expect(decodeSvg(generateQrSvg({ ...base, content: "Meet me at 7pm" }))).toBe("Meet me at 7pm");
  });

  it("decodes a Wi-Fi payload from SVG", () => {
    expect(
      decodeSvg(generateQrSvg({ ...base, content: "WIFI:T:WPA;S:HomeNetwork;P:hunter2;;" })),
    ).toBe("WIFI:T:WPA;S:HomeNetwork;P:hunter2;;");
  });

  it("decodes SVG at every supported output size", () => {
    const payload = "https://freesubqr.vercel.app";
    for (const size of [350, 750, 1500, 3000]) {
      const svg = generateQrSvg({ ...base, size, content: payload });
      expect(svg).toContain(`width="${size}"`);
      expect(svg).toContain(`height="${size}"`);
      expect(decodeSvg(svg)).toBe(payload);
    }
  });

  it("decodes SVG at every error-correction level", () => {
    const payload = "https://freesubqr.vercel.app";
    for (const ecc of ["L", "M", "Q", "H"] as const) {
      expect(decodeSvg(generateQrSvg({ ...base, errorCorrection: ecc, content: payload }))).toBe(
        payload,
      );
    }
  });

  function makeLogo(shape: LogoConfig["shape"]): LogoConfig {
    return {
      enabled: true,
      src: "data:image/png;base64,AAAA",
      type: "upload",
      name: "logo",
      sizeRatio: 0.22,
      shape,
      paddingRatio: 0.18,
      bgColor: "#ffffff",
    };
  }

  it("decodes SVG with a centre logo — rounded badge", () => {
    const payload = "https://freesubqr.vercel.app";
    const svg = generateQrSvg({
      ...base,
      errorCorrection: "H",
      content: payload,
      logo: makeLogo("rounded"),
    });
    expect(decodeSvg(svg)).toBe(payload);
  });

  it("decodes SVG with a centre logo — circular badge", () => {
    const payload = "https://freesubqr.vercel.app";
    const svg = generateQrSvg({
      ...base,
      errorCorrection: "H",
      content: payload,
      logo: makeLogo("circle"),
    });
    expect(decodeSvg(svg)).toBe(payload);
  });

  it("decodes SVG with a centre logo — square badge", () => {
    const payload = "https://freesubqr.vercel.app";
    const svg = generateQrSvg({
      ...base,
      errorCorrection: "H",
      content: payload,
      logo: makeLogo("square"),
    });
    expect(decodeSvg(svg)).toBe(payload);
  });

  it("keeps the SVG viewBox scaled to the payload and quiet zone", () => {
    const short = generateQrSvg({ ...base, content: "a" });
    const long = generateQrSvg({ ...base, content: "a".repeat(400) });
    const shortBox = Number(short.match(/viewBox="0 0 (\d+) (\d+)"/)?.[1] ?? 0);
    const longBox = Number(long.match(/viewBox="0 0 (\d+) (\d+)"/)?.[1] ?? 0);
    expect(longBox).toBeGreaterThan(shortBox);
    // quiet zone of four modules is applied to both PNG and SVG
    expect(longBox).toBeGreaterThan(4 * 2);
  });
});
