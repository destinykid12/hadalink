/**
 * Safe localStorage access.
 * The app must fail gracefully when localStorage is unavailable or holds
 * corrupted data. Every read/write goes through this wrapper.
 */

const memoryFallback = new Map<string, string>();

let storageAvailable: boolean | null = null;

export function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  if (typeof window === "undefined") {
    // Server rendering: use the in-memory fallback only.
    return false;
  }
  try {
    const probe = "__hadalink_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

/** Force the in-memory fallback (used by tests and SSR). */
export function markStorageUnavailable(): void {
  storageAvailable = false;
}

export function storageRead(key: string): string | null {
  try {
    if (!isStorageAvailable()) return memoryFallback.get(key) ?? null;
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

export function storageWrite(key: string, value: string): boolean {
  try {
    if (!isStorageAvailable()) {
      memoryFallback.set(key, value);
      return false;
    }
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    memoryFallback.set(key, value);
    return false;
  }
}

export function storageRemove(key: string): void {
  try {
    if (!isStorageAvailable()) {
      memoryFallback.delete(key);
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    memoryFallback.delete(key);
  }
}

export interface JsonParseOutcome<T> {
  ok: boolean;
  value: T | null;
  corrupted: boolean;
}

export function readJson<T>(key: string, validate: (raw: unknown) => raw is T): JsonParseOutcome<T> {
  const raw = storageRead(key);
  if (raw === null) return { ok: false, value: null, corrupted: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!validate(parsed)) return { ok: false, value: null, corrupted: true };
    return { ok: true, value: parsed, corrupted: false };
  } catch {
    return { ok: false, value: null, corrupted: true };
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    return storageWrite(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
