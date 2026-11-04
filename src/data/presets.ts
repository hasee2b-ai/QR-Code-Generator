import { ColorPreset, PresetItem, SizePreset } from "../types";

/** Preset colors with sharp geometric blocks matching the theme */
export const FOR_COLOR_PRESETS: ColorPreset[] = [
  { name: "Obsidian", hex: "#000000" },
  { name: "Cobalt Blue", hex: "#2563eb" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Amethyst", hex: "#7c3aed" },
  { name: "Amber Orange", hex: "#ea580c" },
];

export const BACK_COLOR_PRESETS: ColorPreset[] = [
  { name: "White", hex: "#ffffff" },
  { name: "Alabaster", hex: "#fafafa" },
  { name: "Soft Cream", hex: "#fffbeb" },
  { name: "Ice Cyan", hex: "#f0fdfa" },
];

/** Sizing presets */
export const SIZE_PRESETS: SizePreset[] = [
  { label: "Small Print", desc: "Digital/Web", value: 350 },
  { label: "Medium Card", desc: "Print standard", value: 750 },
  { label: "Large Poster", desc: "High precision", value: 1500 },
  { label: "Ultra Crisp", desc: "Billboard resolution", value: 3000 },
];

/** Test URL presets */
export const TEST_PRESETS: PresetItem[] = [
  { label: "Google", url: "https://google.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Wikipedia", url: "https://wikipedia.org" },
  { label: "AI Studio", url: "https://ai.studio" },
];
