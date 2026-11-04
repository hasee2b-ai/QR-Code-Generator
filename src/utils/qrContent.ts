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

// Standard URL regex validation
export const isValidUrl = (string: string) => {
  if (!string) return false;
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i"
  );
  return !!pattern.test(string);
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
