/**
 * Persist active org + org list so account pages paint instantly while network refreshes.
 */

import { canUseStorage, readJson, removeKey, writeJson } from "@/lib/utils/local-storage";

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

export function readCachedActiveOrg(): CachedActiveOrganization | null {
  const parsed = readJson<CachedActiveOrganization>(ORG_KEY);
  if (!parsed || typeof parsed.id !== "string" || typeof parsed.slug !== "string") return null;
  return parsed;
}

export function writeCachedActiveOrg(org: CachedActiveOrganization | null): void {
  if (!org) {
    removeKey(ORG_KEY);
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
  removeKey(ORG_KEY);
  removeKey(ORGS_KEY);
}
