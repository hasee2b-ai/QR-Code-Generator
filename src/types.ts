export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type LogoShape = "rounded" | "circle" | "square";

/** What the user is encoding: a link, plain text, or a Wi-Fi join payload. */
export type ContentType = "url" | "text" | "wifi";

/** Wi-Fi authentication type (`nopass` = open network). */
export type WifiSecurity = "WPA" | "WEP" | "nopass";

export interface WifiConfig {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}


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
  /**
   * How `bgColor` is picked: synced to the QR pattern background, or a fixed
   * color the user chose (so it survives later pattern changes). Absent on
   * history entries from older versions — App infers the mode on restore.
   */
  badgeBgMode?: "pattern" | "custom";
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
  /** How `url` should be interpreted when restored (defaults to `"url"`). */
  contentType?: ContentType;
  /** Raw Wi-Fi form values, present when `contentType` is `"wifi"`. */
  wifi?: WifiConfig;
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

