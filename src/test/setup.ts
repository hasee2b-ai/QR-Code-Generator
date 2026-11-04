import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

/**
 * Node ≥22 defines a global `localStorage` getter that only works when
 * `--localstorage-file` is passed, and Vitest's jsdom environment keeps that
 * broken getter instead of jsdom's own implementation. App code reads and
 * writes storage while rendering, so install a working in-memory Storage.
 *
 * The implementation is installed on `Storage.prototype` rather than as own
 * properties of the storage object, so tests can stub
 * `Storage.prototype.getItem` / `setItem` and have those stubs actually
 * affect the app under test.
 */
const memory = new Map<string, string>();

const memoryStorage = {
  getItem(key: string) {
    const k = String(key);
    return memory.has(k) ? memory.get(k)! : null;
  },
  setItem(key: string, value: string) {
    memory.set(String(key), String(value));
  },
  removeItem(key: string) {
    memory.delete(String(key));
  },
  clear() {
    memory.clear();
  },
  key(index: number) {
    return Array.from(memory.keys())[index] ?? null;
  },
};

if (typeof Storage !== "undefined") {
  Object.defineProperties(Storage.prototype, {
    length: { get: () => memory.size, configurable: true },
    getItem: { value: memoryStorage.getItem, writable: true, configurable: true },
    setItem: { value: memoryStorage.setItem, writable: true, configurable: true },
    removeItem: { value: memoryStorage.removeItem, writable: true, configurable: true },
    clear: { value: memoryStorage.clear, writable: true, configurable: true },
    key: { value: memoryStorage.key, writable: true, configurable: true },
  });

  Object.defineProperty(globalThis, "localStorage", {
    value: Object.create(Storage.prototype),
    configurable: true,
    writable: true,
  });
} else {
  // No Storage constructor available — fall back to a plain object.
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      get length() {
        return memory.size;
      },
      ...memoryStorage,
    },
    configurable: true,
    writable: true,
  });
}

// jsdom keeps the document alive between test files — reset it explicitly so
// renders never leak into the next test.
afterEach(() => {
  cleanup();
});
