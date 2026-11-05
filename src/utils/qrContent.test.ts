import { describe, expect, it } from "vitest";
import { buildQrContent, buildWifiPayload, escapeWifiValue, isValidUrl } from "./qrContent";
import { DEFAULT_WIFI, WIFI_OPEN, WIFI_PRIVATE, WIFI_WITH_ESCAPES } from "../test/fixtures";

describe("isValidUrl", () => {
  it("accepts full URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://google.com")).toBe(true);
    expect(isValidUrl("http://google.com/search?q=qr#top")).toBe(true);
  });

  it("accepts hostnames with a real dot (https:// is prepended)", () => {
    expect(isValidUrl("https://example.com/?next=https://x.com")).toBe(true);
    expect(isValidUrl("https://example.com/#/settings")).toBe(true);
    expect(isValidUrl("https://example.com/@user")).toBe(true);
    expect(isValidUrl("maps.google.com/?q=31.5,74.3")).toBe(true);
    expect(isValidUrl("example.com/path(1)")).toBe(true);
    expect(isValidUrl("bücher.de")).toBe(true);
  });

  it("accepts localhost ports and bare IPv4 addresses", () => {
    expect(isValidUrl("localhost:3000")).toBe(true);
    expect(isValidUrl("192.168.0.1")).toBe(true);
  });

  it("rejects empty strings and free text", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("   ")).toBe(false);
    expect(isValidUrl("hello")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("example.com/a b")).toBe(false);
  });

  it("rejects hostless references without a hostname", () => {
    expect(isValidUrl("?next=https://x.com")).toBe(false);
    expect(isValidUrl("#/settings")).toBe(false);
    expect(isValidUrl("/@user")).toBe(false);
  });

  it("rejects non-http(s) protocols", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("buildQrContent — url type", () => {
  it("prefixes https:// when the protocol is missing", () => {
    expect(
      buildQrContent({ contentType: "url", url: "google.com", text: "", wifi: DEFAULT_WIFI })
    ).toBe("https://google.com");
  });

  it("leaves an existing protocol untouched", () => {
    expect(
      buildQrContent({ contentType: "url", url: "https://google.com", text: "", wifi: DEFAULT_WIFI })
    ).toBe("https://google.com");
    expect(
      buildQrContent({ contentType: "url", url: "http://google.com", text: "", wifi: DEFAULT_WIFI })
    ).toBe("http://google.com");
  });

  it("does not force a protocol onto strings without a dot", () => {
    expect(
      buildQrContent({ contentType: "url", url: "hello world", text: "", wifi: DEFAULT_WIFI })
    ).toBe("hello world");
  });

  it("returns an empty string for empty input", () => {
    expect(buildQrContent({ contentType: "url", url: "   ", text: "", wifi: DEFAULT_WIFI })).toBe(
      "   "
    );
    expect(buildQrContent({ contentType: "url", url: "", text: "", wifi: DEFAULT_WIFI })).toBe("");
  });
});

describe("buildQrContent — text type", () => {
  it("encodes the raw text without touching it", () => {
    expect(
      buildQrContent({ contentType: "text", url: "https://ignored.com", text: "google.com", wifi: DEFAULT_WIFI })
    ).toBe("google.com");
    expect(
      buildQrContent({ contentType: "text", url: "", text: "Line one\nLine two", wifi: DEFAULT_WIFI })
    ).toBe("Line one\nLine two");
  });
});

describe("buildQrContent — wifi type", () => {
  it("builds a Wi-Fi payload from the form values", () => {
    expect(buildQrContent({ contentType: "wifi", url: "", text: "", wifi: WIFI_PRIVATE })).toBe(
      "WIFI:T:WPA;S:HomeNetwork;P:hunter2;;"
    );
  });

  it("ignores the url/text fields for the wifi type", () => {
    expect(
      buildQrContent({ contentType: "wifi", url: "google.com", text: "hello", wifi: WIFI_PRIVATE })
    ).toBe("WIFI:T:WPA;S:HomeNetwork;P:hunter2;;");
  });
});

describe("buildWifiPayload", () => {
  it("omits the password field for open networks", () => {
    expect(buildWifiPayload(WIFI_OPEN)).toBe("WIFI:T:nopass;S:CafeGuest;;");
  });

  it("marks hidden networks", () => {
    const payload = buildWifiPayload({ ...WIFI_PRIVATE, hidden: true });
    expect(payload).toBe("WIFI:T:WPA;S:HomeNetwork;P:hunter2;H:true;;");
  });

  it("supports WEP", () => {
    expect(buildWifiPayload({ ...WIFI_PRIVATE, security: "WEP", password: "abc12" })).toBe(
      "WIFI:T:WEP;S:HomeNetwork;P:abc12;;"
    );
  });

  it("escapes reserved characters in the SSID and password", () => {
    expect(escapeWifiValue('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f');
    expect(buildWifiPayload(WIFI_WITH_ESCAPES)).toBe(
      "WIFI:T:WPA;S:My\\;Net;P:p\\:ss\\,word;;"
    );
  });
});
