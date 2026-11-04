import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

/**
 * Node ≥22 defines a global `localStorage` getter that only works when
 * `--localstorage-file` is passed, and Vitest's jsdom environment keeps that
 * broken getter instead of jsdom's own implementation. App code reads and
 * writes storage while rendering, so install a working in-memory Storage.
 */
const memory = new Map<string, string>();

const storage = {
  get length() {
    return memory.size;
  },
  clear() {
    memory.clear();
  },
  getItem(key: string) {
    return memory.has(String(key)) ? memory.get(String(key))! : null;
  },
  key(index: number) {
    return Array.from(memory.keys())[index] ?? null;
  },
  removeItem(key: string) {
    memory.delete(String(key));
  },
  setItem(key: string, value: string) {
    memory.set(String(key), String(value));
  },
} as unknown as Storage;

Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true,
  writable: true,
});

// jsdom keeps the document alive between test files — reset it explicitly so
// renders never leak into the next test.
afterEach(() => {
  cleanup();
});
