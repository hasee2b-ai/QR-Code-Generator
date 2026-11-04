import { describe, expect, it } from "vitest";
import {
  PRESET_LOGOS,
  createPresetSvgDataUri,
  getHighContrastColor,
  getLuminance,
  resolvePresetIconColor,
} from "./presetLogos";

describe("getLuminance", () => {
  it("returns 0 for black and 1 for white", () => {
    expect(getLuminance("#000000")).toBeCloseTo(0, 5);
    expect(getLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("supports 3-digit hex shorthand", () => {
    expect(getLuminance("#fff")).toBeCloseTo(1, 5);
    expect(getLuminance("#000")).toBeCloseTo(0, 5);
  });

  it("falls back to 1 for missing or malformed input", () => {
    expect(getLuminance("")).toBe(1);
    expect(getLuminance("not-a-color")).toBe(1);
    expect(getLuminance("#12345")).toBe(1);
  });
});

describe("getHighContrastColor", () => {
  it("returns black on light backgrounds and white on dark ones", () => {
    expect(getHighContrastColor("#ffffff")).toBe("#000000");
    expect(getHighContrastColor("#000000")).toBe("#ffffff");
  });

  it("keeps the desired color when the contrast is sufficient", () => {
    expect(getHighContrastColor("#ffffff", "#000000")).toBe("#000000");
    expect(getHighContrastColor("#000000", "#ffffff")).toBe("#ffffff");
  });

  it("rejects a desired color that is too close to the background", () => {
    expect(getHighContrastColor("#ffffff", "#f0f0f0")).toBe("#000000");
    expect(getHighContrastColor("#000000", "#101010")).toBe("#ffffff");
  });

  it("treats \"auto\" as no preference", () => {
    expect(getHighContrastColor("#ffffff", "auto")).toBe("#000000");
    expect(getHighContrastColor("#000000", "auto")).toBe("#ffffff");
  });
});

describe("resolvePresetIconColor", () => {
  it("falls back to the matrix color when the preference is auto", () => {
    expect(resolvePresetIconColor("#ffffff", "auto", "#000000")).toBe("#000000");
    expect(resolvePresetIconColor("#000000", undefined, "#ffffff")).toBe("#ffffff");
  });

  it("upgrades an unreadable preference to a high-contrast one", () => {
    expect(resolvePresetIconColor("#ffffff", "#ffffff", "#000000")).toBe("#000000");
  });

  it("keeps a readable explicit preference", () => {
    expect(resolvePresetIconColor("#ffffff", "#000000", "#ffffff")).toBe("#000000");
  });
});

describe("createPresetSvgDataUri", () => {
  it("produces an svg data URI", () => {
    const uri = createPresetSvgDataUri(PRESET_LOGOS[0], "#000000");
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);

    const svg = decodeURIComponent(uri.split(",")[1]);
    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it("applies the color to stroke presets", () => {
    const globe = PRESET_LOGOS.find((p) => p.id === "globe")!;
    const svg = decodeURIComponent(createPresetSvgDataUri(globe, "#2563eb").split(",")[1]);
    expect(svg).toContain('stroke="#2563eb"');
  });

  it("applies the color to fill presets", () => {
    const github = PRESET_LOGOS.find((p) => p.id === "github")!;
    const svg = decodeURIComponent(createPresetSvgDataUri(github, "#ffffff").split(",")[1]);
    expect(svg).toContain('fill="#ffffff"');
  });

  it("falls back to black when no color is given", () => {
    const svg = decodeURIComponent(createPresetSvgDataUri(PRESET_LOGOS[0], "").split(",")[1]);
    expect(svg).toContain('stroke="#000000"');
  });
});

describe("PRESET_LOGOS", () => {
  it("exposes 13 icons with unique ids", () => {
    expect(PRESET_LOGOS).toHaveLength(13);
    const ids = PRESET_LOGOS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
