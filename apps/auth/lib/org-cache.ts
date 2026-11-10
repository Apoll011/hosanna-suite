/**
 * Persist active org + org list so account pages paint instantly while network refreshes.
 */

export type CachedOrgSummary = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type CachedOrgMember = {
  id: string;
  userId: string;
  role: string;
  createdAt?: string | Date;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export type CachedActiveOrganization = CachedOrgSummary & {
  metadata?: unknown;
  members?: CachedOrgMember[];
};

const ORG_KEY = "hosanna.auth.cached_active_org";
const ORGS_KEY = "hosanna.auth.cached_org_list";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function readCachedActiveOrg(): CachedActiveOrganization | null {
  const parsed = readJson<CachedActiveOrganization>(ORG_KEY);
  if (!parsed || typeof parsed.id !== "string" || typeof parsed.slug !== "string") return null;
  return parsed;
}

export function writeCachedActiveOrg(org: CachedActiveOrganization | null): void {
  if (!org) {
    if (canUseStorage()) {
      try {
        localStorage.removeItem(ORG_KEY);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  writeJson(ORG_KEY, org);
}

export function readCachedOrgList(): CachedOrgSummary[] | null {
  const parsed = readJson<CachedOrgSummary[]>(ORGS_KEY);
  return Array.isArray(parsed) ? parsed : null;
}

export function writeCachedOrgList(orgs: CachedOrgSummary[]): void {
  writeJson(ORGS_KEY, orgs);
}

export function clearCachedOrg(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ORGS_KEY);
  } catch {
    /* ignore */
  }
}
