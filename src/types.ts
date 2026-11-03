export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type LogoShape = "rounded" | "circle" | "square";

export interface LogoConfig {
  enabled: boolean;
  src: string; // Base64 Data URL or SVG Data URI
  type: "preset" | "upload";
  presetId?: string;
  name?: string;
  sizeRatio: number; // e.g. 0.22 (22%)
  shape: LogoShape;
  paddingRatio: number; // e.g. 0.18
  bgColor?: string; // custom or background color
  iconColor?: string; // custom preset icon color or 'auto'
}

export interface PresetLogo {
  id: string;
  name: string;
  category: "utility" | "brand";
  svgPath: string; // inner SVG path or elements
  viewBox?: string;
}

export interface QrHistoryItem {
  id: string;
  url: string;
  timestamp: number;
  qrColor: string;
  bgColor: string;
  size: number;
  errorCorrection: ErrorCorrectionLevel;
  logo?: LogoConfig | null;
}

export interface PresetItem {
  label: string;
  url: string;
}

export interface ColorPreset {
  name: string;
  hex: string;
}

export interface SizePreset {
  label: string;
  desc: string;
  value: number;
}

