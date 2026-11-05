export interface PresetLogoDef {
  id: string;
  name: string;
  type: "stroke" | "fill";
  viewBox: string;
  elements: string; // Inner SVG elements
}

export const PRESET_LOGOS: PresetLogoDef[] = [
  {
    id: "globe",
    name: "Globe",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>`
  },
  {
    id: "link",
    name: "Link",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`
  },
  {
    id: "star",
    name: "Star",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`
  },
  {
    id: "heart",
    name: "Heart",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`
  },
  {
    id: "sparkles",
    name: "Magic",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>`
  },
  {
    id: "shield",
    name: "Shield",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`
  },
  {
    id: "wifi",
    name: "Wi-Fi",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>`
  },
  {
    id: "mail",
    name: "Mail",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`
  },
  {
    id: "coffee",
    name: "Coffee",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M4 19h14"/>`
  },
  {
    id: "cart",
    name: "Store",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`
  },
  {
    id: "github",
    name: "GitHub",
    type: "fill",
    viewBox: "0 0 24 24",
    elements: `<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>`
  },
  {
    id: "youtube",
    name: "YouTube",
    type: "fill",
    viewBox: "0 0 24 24",
    elements: `<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`
  },
  {
    id: "instagram",
    name: "Instagram",
    type: "stroke",
    viewBox: "0 0 24 24",
    elements: `<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>`
  }
];

export function getLuminance(hex: string): number {
  if (!hex) return 1;
  const clean = hex.replace("#", "").trim();
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) || 0;
    g = parseInt(clean.slice(2, 4), 16) || 0;
    b = parseInt(clean.slice(4, 6), 16) || 0;
  } else {
    return 1;
  }
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Contrast ratio (approx.), built on the existing luminance helper: how much
 * brighter the lighter color is than the darker one. White vs black → 21.
 */
export function getContrastRatio(a: string, b: string): number {
  const la = getLuminance(a);
  const lb = getLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getHighContrastColor(bgHex: string, desiredHex?: string): string {
  const bgLum = getLuminance(bgHex);
  if (desiredHex && desiredHex !== "auto") {
    const desiredLum = getLuminance(desiredHex);
    // If contrast is sufficient (luminance difference >= 0.3)
    if (Math.abs(bgLum - desiredLum) >= 0.3) {
      return desiredHex;
    }
  }
  // Default to maximum contrast against the background
  return bgLum >= 0.5 ? "#000000" : "#ffffff";
}

export function resolvePresetIconColor(
  badgeBg: string,
  iconColorPreference?: string,
  matrixQrColor?: string
): string {
  const bg = badgeBg || "#ffffff";
  if (iconColorPreference && iconColorPreference !== "auto") {
    return getHighContrastColor(bg, iconColorPreference);
  }
  if (matrixQrColor) {
    return getHighContrastColor(bg, matrixQrColor);
  }
  return getHighContrastColor(bg);
}

export function createPresetSvgDataUri(preset: PresetLogoDef, color: string): string {
  const cleanColor = color || "#000000";
  let svgContent = "";
  if (preset.type === "fill") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${preset.viewBox}" width="160" height="160" fill="${cleanColor}">${preset.elements}</svg>`;
  } else {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${preset.viewBox}" width="160" height="160" fill="none" stroke="${cleanColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${preset.elements}</svg>`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}
