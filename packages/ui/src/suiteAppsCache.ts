/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Session-scoped suite catalog cache: paint from cache, refresh once per
 * page load, share one in-flight fetch across AppSwitcher + home.
 */

const STORAGE_KEY = "hosanna.suite.apps.v1";

/** Minimal catalog shape shared by AppSwitcher + home. */
export type SuiteCatalogApp = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  nameKey?: string | null;
  shortNameKey?: string | null;
  descriptionKey?: string | null;
  logoUrl: string;
  homeUrl: string | null;
  status: "live" | "coming_soon" | string;
  accessible?: boolean;
  accent?: string;
};

type CatalogResponse = { apps?: SuiteCatalogApp[] };

type CacheEntry = {
  url: string;
  apps: SuiteCatalogApp[];
  fetchedAt: number;
};

let memory: CacheEntry | null = null;
/** One in-flight fetch per page load (keyed by URL). */
const inflight = new Map<string, Promise<SuiteCatalogApp[]>>();
/** URLs already refreshed this page load — further calls reuse memory/storage. */
const refreshedThisLoad = new Set<string>();

function readStorage(url: string): SuiteCatalogApp[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || parsed.url !== url || !Array.isArray(parsed.apps)) return null;
    return parsed.apps;
  } catch {
    return null;
  }
}

function writeStorage(url: string, apps: SuiteCatalogApp[]): void {
  const entry: CacheEntry = { url, apps, fetchedAt: Date.now() };
  memory = entry;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

/** Sync read of cached apps for immediate paint (memory, then sessionStorage). */
export function peekSuiteAppsCache(url: string): SuiteCatalogApp[] | null {
  if (memory?.url === url && Array.isArray(memory.apps)) return memory.apps;
  const stored = readStorage(url);
  if (stored) {
    memory = { url, apps: stored, fetchedAt: Date.now() };
    return stored;
  }
  return null;
}

async function fetchCatalog(url: string): Promise<SuiteCatalogApp[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as CatalogResponse;
  return Array.isArray(data.apps) ? data.apps : [];
}

/**
 * Refreshes at most once per page load for `url`. Concurrent callers share
 * the same promise. Callers should `peekSuiteAppsCache` first for SWR paint.
 */
export async function loadSuiteApps(
  url: string,
  opts?: { force?: boolean },
): Promise<SuiteCatalogApp[]> {
  const cached = peekSuiteAppsCache(url);
  if (cached && refreshedThisLoad.has(url) && !opts?.force) {
    return cached;
  }

  const existing = inflight.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const apps = await fetchCatalog(url);
      writeStorage(url, apps);
      refreshedThisLoad.add(url);
      return apps;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, promise);
  return promise;
}

/** Test helper — clears memory + session flag (does not wipe sessionStorage). */
export function resetSuiteAppsCacheForTests(): void {
  memory = null;
  inflight.clear();
  refreshedThisLoad.clear();
}
