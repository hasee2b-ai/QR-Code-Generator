/**
 * Thin, failure-proof wrappers around `localStorage`.
 *
 * Storage access can throw for reasons outside our control — Safari private
 * mode, disabled cookies/storage, quota exceeded, or a hostile extension.
 * Every call is wrapped in try/catch so persistence problems never break the
 * UI: reads degrade to `null`, writes are silently dropped.
 */

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full — nothing the app can do about it.
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable — the value simply stays (or never was) there.
  }
}
