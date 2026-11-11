/**
 * Browser localStorage helpers shared by account/org client caches.
 */

export function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function removeKey(key: string): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
