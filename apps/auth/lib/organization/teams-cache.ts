// SPDX-License-Identifier: AGPL-3.0-only
import { canUseStorage, readJson, removeKey, writeJson } from "@/lib/utils/local-storage";

export type TeamCacheMember = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type TeamCacheItem = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  members: TeamCacheMember[];
};

const keyFor = (organizationId: string) => `hosanna.auth.teams.${organizationId}`;

export function readCachedTeams(organizationId: string): TeamCacheItem[] | null {
  const value = readJson<TeamCacheItem[]>(keyFor(organizationId));
  return Array.isArray(value) ? value : null;
}

export function writeCachedTeams(organizationId: string, teams: TeamCacheItem[]): void {
  writeJson(keyFor(organizationId), teams);
}

export function clearCachedTeams(organizationId: string): void {
  if (canUseStorage()) removeKey(keyFor(organizationId));
}
