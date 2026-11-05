import { ContentType, WifiConfig } from "../types";

/**
 * Builds the string that actually gets encoded into the QR matrix, based on
 * the selected content type.
 */

export interface QrContentInput {
  contentType: ContentType;
  url: string;
  text: string;
  wifi: WifiConfig;
}

/**
 * True for a dotted-quad IPv4 hostname with every octet in range 0–255.
 */
function isIpv4Hostname(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^[0-9]{1,3}$/.test(part) && Number(part) <= 255);
}

/**
 * URL validation built on the platform's `new URL()` parser instead of a hand
 * rolled regex:
 * - a protocol is required; `https://` is tried first when none was typed
 * - only http/https protocols are accepted
 * - the hostname must contain a dot, be `localhost`, or be an IPv4 address
 */
export const isValidUrl = (string: string) => {
  const candidate = string.trim();
  // Whitespace anywhere means the string was never a URL (the URL parser would
  // happily keep a literal space in the path).
  if (!candidate || /\s/.test(candidate)) return false;

  // Only an explicit `http(s)://` prefix counts as a protocol; anything else
  // (e.g. `localhost:3000`, which parses as an opaque scheme) gets a
  // `https://` prepended instead.
  const hasProtocol = /^https?:\/\//i.test(candidate);
  const normalized = hasProtocol ? candidate : `https://${candidate}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname;
  return hostname.includes(".") || hostname === "localhost" || isIpv4Hostname(hostname);
};

/**
 * Wi-Fi payloads follow the de-facto `WIFI:T:...;;` scheme understood by
 * iOS/Android camera apps. Special characters must be backslash-escaped.
 */
export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(wifi: WifiConfig): string {
  const parts = [`T:${wifi.security}`, `S:${escapeWifiValue(wifi.ssid)}`];

  if (wifi.security !== "nopass" && wifi.password) {
    parts.push(`P:${escapeWifiValue(wifi.password)}`);
  }
  if (wifi.hidden) {
    parts.push("H:true");
  }

  return `WIFI:${parts.join(";")};;`;
}

/**
 * Returns the payload to encode:
 * - `url`  → the URL, with `https://` auto-prefixed when the protocol is missing
 * - `text` → the raw text, untouched
 * - `wifi` → a Wi-Fi join payload built from the network form
 */
export function buildQrContent(input: QrContentInput): string {
  if (input.contentType === "text") {
    return input.text;
  }

  if (input.contentType === "wifi") {
    return buildWifiPayload(input.wifi);
  }

  const raw = input.url;
  if (!raw) return "";

  const needsProtocol = !/^https?:\/\//i.test(raw);
  if (needsProtocol && raw.includes(".")) {
    return `https://${raw}`;
  }

  return raw;
}
