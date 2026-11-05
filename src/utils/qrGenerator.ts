import QRCode from "qrcode";
import { LogoConfig, ErrorCorrectionLevel } from "../types";
import { getHighContrastColor } from "./presetLogos";
import { QUIET_ZONE_MODULES } from "./qrSvg";

export interface GenerateQrOptions {
  url: string;
  size: number;
  qrColor: string;
  bgColor: string;
  errorCorrection: ErrorCorrectionLevel;
  logo?: LogoConfig | null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generates a high-resolution QR code data URL, optionally rendering a center logo badge.
 */
export async function generateQrCode(options: GenerateQrOptions): Promise<string> {
  const { url, size, qrColor, bgColor, errorCorrection, logo } = options;

  // When a logo is placed in the center, error correction level must be at least Q or H
  // to guarantee 100% scan reliability even with the center area obscured.
  const hasActiveLogo = Boolean(logo && logo.enabled && logo.src);
  const effectiveErrorCorrection: ErrorCorrectionLevel = hasActiveLogo ? "H" : errorCorrection;

  // 1. Generate base QR matrix
  const baseDataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: QUIET_ZONE_MODULES,
    color: {
      dark: qrColor,
      light: bgColor,
    },
    errorCorrectionLevel: effectiveErrorCorrection,
  });

  // 2. If no logo, return base QR
  if (!hasActiveLogo || !logo) {
    return baseDataUrl;
  }

  // 3. Render base QR + center badge onto canvas
  return new Promise<string>((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(baseDataUrl);
      return;
    }

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      // Draw the base QR code
      ctx.drawImage(qrImg, 0, 0, size, size);

      // Load logo
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";

      logoImg.onload = () => {
        const ratio = logo.sizeRatio || 0.22;
        const logoBadgeSize = Math.round(size * ratio);
        const x = Math.round((size - logoBadgeSize) / 2);
        const y = Math.round((size - logoBadgeSize) / 2);

        // Badge background (defaults to QR background so it seamlessly clears the center)
        const badgeBg = logo.bgColor || bgColor || "#ffffff";
        const shape = logo.shape || "rounded";
        const strokeColor = getHighContrastColor(badgeBg, qrColor);

        ctx.save();

        // 1. Draw badge background (opaque base to cleanly clear QR code matrix blocks)
        ctx.fillStyle = badgeBg;

        if (shape === "circle") {
          ctx.beginPath();
          ctx.arc(
            x + logoBadgeSize / 2,
            y + logoBadgeSize / 2,
            logoBadgeSize / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Subtle hairline border with crisp definition
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(1, Math.round(size * 0.005));
          ctx.stroke();
        } else if (shape === "rounded") {
          const cornerRadius = Math.round(logoBadgeSize * 0.22);
          drawRoundedRect(ctx, x, y, logoBadgeSize, logoBadgeSize, cornerRadius);
          ctx.fill();

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(1, Math.round(size * 0.005));
          ctx.stroke();
        } else {
          // Sharp brutalist square
          ctx.fillRect(x, y, logoBadgeSize, logoBadgeSize);

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(1, Math.round(size * 0.005));
          ctx.strokeRect(x, y, logoBadgeSize, logoBadgeSize);
        }

        // 2. Inner padding for icon
        const padding = Math.round(logoBadgeSize * (logo.paddingRatio ?? 0.18));
        const iconSize = logoBadgeSize - padding * 2;
        const iconX = x + padding;
        const iconY = y + padding;

        // Clip inner area according to badge shape if needed
        if (shape === "circle") {
          ctx.beginPath();
          ctx.arc(
            x + logoBadgeSize / 2,
            y + logoBadgeSize / 2,
            logoBadgeSize / 2 - 2,
            0,
            Math.PI * 2
          );
          ctx.clip();
        } else if (shape === "rounded") {
          const innerRadius = Math.max(2, Math.round(logoBadgeSize * 0.18));
          drawRoundedRect(ctx, iconX, iconY, iconSize, iconSize, innerRadius);
          ctx.clip();
        }

        // 3. Draw image centered
        // Calculate aspect ratio fit
        const naturalWidth = logoImg.naturalWidth || iconSize;
        const naturalHeight = logoImg.naturalHeight || iconSize;
        const scale = Math.min(iconSize / naturalWidth, iconSize / naturalHeight);
        const drawW = naturalWidth * scale;
        const drawH = naturalHeight * scale;
        const drawX = iconX + (iconSize - drawW) / 2;
        const drawY = iconY + (iconSize - drawH) / 2;

        ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);

        ctx.restore();

        try {
          const finalUrl = canvas.toDataURL("image/png");
          resolve(finalUrl);
        } catch {
          resolve(baseDataUrl);
        }
      };

      logoImg.onerror = () => {
        // In case logo fails, keep base QR intact
        resolve(baseDataUrl);
      };

      logoImg.src = logo.src;
    };

    qrImg.onerror = () => {
      resolve(baseDataUrl);
    };

    qrImg.src = baseDataUrl;
  });
}
