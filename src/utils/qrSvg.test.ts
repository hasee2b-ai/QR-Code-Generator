import { describe, expect, it } from "vitest";
import { generateQrSvg } from "./qrSvg";
import { LogoConfig } from "../types";

const base = {
  content: "https://freesubqr.vercel.app",
  size: 750,
  qrColor: "#000000",
  bgColor: "#ffffff",
  errorCorrection: "M" as const,
};

const viewBoxSize = (svg: string): number => {
  const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!match) throw new Error("viewBox missing from generated SVG");
  return Number(match[1]);
};

describe("generateQrSvg", () => {
  it("returns a standalone svg sized to the requested export", () => {
    const svg = generateQrSvg(base);

    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('width="750"');
    expect(svg).toContain('height="750"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it("paints the background and the matrix with the chosen colors", () => {
    const svg = generateQrSvg({ ...base, qrColor: "#2563eb", bgColor: "#fffbeb" });

    expect(svg).toContain('fill="#fffbeb"');
    expect(svg).toContain('fill="#2563eb"');
    expect(svg).toContain('<path d="M');
  });

  it("grows the viewBox as the payload grows", () => {
    const short = viewBoxSize(generateQrSvg({ ...base, content: "a" }));
    const long = viewBoxSize(generateQrSvg({ ...base, content: "a".repeat(400) }));

    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
  });

  it("encodes non-URL payloads such as Wi-Fi join strings", () => {
    const svg = generateQrSvg({ ...base, content: "WIFI:T:WPA;S:HomeNetwork;P:hunter2;;" });

    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg).toContain('<path d="M');
  });

  it("adds a rounded badge with an embedded image when a logo is active", () => {
    const logo: LogoConfig = {
      enabled: true,
      src: "data:image/png;base64,AAAA&BBB",
      type: "upload",
      sizeRatio: 0.22,
      shape: "rounded",
      paddingRatio: 0.15,
      bgColor: "#ffffff",
    };

    const svg = generateQrSvg({ ...base, logo });

    expect(svg).toContain("<clipPath");
    expect(svg).toContain('rx="');
    // href (SVG2) plus xlink:href for older editors, both XML-escaped
    expect(svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(svg).toMatch(
      /<image href="data:image\/png;base64,AAAA&amp;BBB" xlink:href="data:image\/png;base64,AAAA&amp;BBB"/
    );
    expect(svg).toContain("AAAA&amp;BBB");
    expect(svg).not.toContain('href="data:image/png;base64,AAAA&BBB"');
    expect(svg).not.toContain('xlink:href="data:image/png;base64,AAAA&BBB"');
  });

  it("renders a circular badge for the circle shape", () => {
    const logo: LogoConfig = {
      enabled: true,
      src: "data:image/png;base64,AAAA",
      type: "upload",
      sizeRatio: 0.22,
      shape: "circle",
      paddingRatio: 0.15,
    };

    const svg = generateQrSvg({ ...base, logo });

    expect(svg).toContain("<circle");
    expect(svg).toContain("<clipPath");
  });

  it("ignores a logo that is not enabled", () => {
    const logo: LogoConfig = {
      enabled: false,
      src: "data:image/png;base64,AAAA",
      type: "upload",
      sizeRatio: 0.22,
      shape: "rounded",
      paddingRatio: 0.15,
    };

    const svg = generateQrSvg({ ...base, logo });

    expect(svg).not.toContain("<image");
    expect(svg).not.toContain("<clipPath");
  });

  it("throws when the payload cannot fit in a QR code", () => {
    expect(() => generateQrSvg({ ...base, content: "x".repeat(4000) })).toThrow();
  });
});
