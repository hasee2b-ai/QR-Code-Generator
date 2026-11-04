import QRCode from "qrcode";
import { ErrorCorrectionLevel, LogoConfig } from "../types";
import { getHighContrastColor } from "./presetLogos";

/**
 * Renders the QR matrix as a scalable SVG string (optionally with the same
 * center badge the PNG renderer draws). Mirrors the PNG pipeline in
 * qrGenerator.ts: same encoder, same colors, same logo geometry.
 */

export interface GenerateQrSvgOptions {
  content: string;
  size: number;
  qrColor: string;
  bgColor: string;
  errorCorrection: ErrorCorrectionLevel;
  logo?: LogoConfig | null;
}

/** Quiet zone in modules — matches the `margin: 3` used by the PNG renderer. */
const MARGIN = 3;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds the module path, e.g. `M4 6h1v1h-1z` for every dark module. */
function buildModulePath(size: number, get: (row: number, col: number) => number): string {
  let path = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (get(row, col)) {
        path += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`;
      }
    }
  }
  return path;
}

export function generateQrSvg(options: GenerateQrSvgOptions): string {
  const { content, size, qrColor, bgColor, errorCorrection, logo } = options;

  // A center badge obscures modules, so force level H like the PNG path does.
  const hasActiveLogo = Boolean(logo && logo.enabled && logo.src);
  const effectiveErrorCorrection: ErrorCorrectionLevel = hasActiveLogo ? "H" : errorCorrection;

  const qr = QRCode.create(content, { errorCorrectionLevel: effectiveErrorCorrection });
  const matrix = qr.modules;
  const total = matrix.size + MARGIN * 2;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`
  );
  parts.push(`<rect width="${total}" height="${total}" fill="${escapeXml(bgColor)}"/>`);
  parts.push(`<path d="${buildModulePath(matrix.size, (r, c) => matrix.get(r, c))}" fill="${escapeXml(qrColor)}"/>`);

  if (hasActiveLogo && logo) {
    const ratio = logo.sizeRatio || 0.22;
    const badge = total * ratio;
    const x = (total - badge) / 2;
    const y = x;
    const badgeBg = logo.bgColor || bgColor || "#ffffff";
    const shape = logo.shape || "rounded";
    const stroke = getHighContrastColor(badgeBg, qrColor);
    const strokeWidth = Math.max(0.5, total * 0.005);
    const clipId = "qr-badge-clip";

    let badgeShape = "";

    if (shape === "circle") {
      const cx = x + badge / 2;
      const cy = y + badge / 2;
      const r = badge / 2;
      parts.push(
        `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${Math.max(0, r - 1)}"/></clipPath>`
      );
      badgeShape = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${escapeXml(badgeBg)}" stroke="${escapeXml(
        stroke
      )}" stroke-width="${strokeWidth}"/>`;
    } else if (shape === "rounded") {
      const rx = Math.round(badge * 0.22);
      parts.push(
        `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${badge}" height="${badge}" rx="${rx}"/></clipPath>`
      );
      badgeShape = `<rect x="${x}" y="${y}" width="${badge}" height="${badge}" rx="${rx}" fill="${escapeXml(
        badgeBg
      )}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}"/>`;
    } else {
      parts.push(
        `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${badge}" height="${badge}"/></clipPath>`
      );
      badgeShape = `<rect x="${x}" y="${y}" width="${badge}" height="${badge}" fill="${escapeXml(
        badgeBg
      )}" stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}"/>`;
    }

    const padding = badge * (logo.paddingRatio ?? 0.18);
    const iconSize = badge - padding * 2;
    const iconX = x + padding;
    const iconY = y + padding;

    parts.push(badgeShape);
    parts.push(
      `<image href="${escapeXml(logo.src)}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`
    );
  }

  parts.push("</svg>");
  return parts.join("");
}
