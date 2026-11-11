/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Permission-aware views of domain packs for hosanna_capabilities / permissions.
 */

import type { AppRole, AppRoleId, PermissionString } from "@hosanna/auth";
import { resolveEffectivePermissions } from "@hosanna/auth";
import { can } from "../../middleware/auth.js";
import { ensureDomainPacksRegistered } from "./packs.js";
import { listDomainPacks, allPackToolGates } from "./registry.js";
import type { DomainPack, McpToolGate } from "./types.js";

type RoleUser = { role: AppRole | string };

export type ToolAvailability = {
  name: string;
  domainId: string;
  permission: PermissionString | null;
  requiresEntitlement: boolean;
  /** true when no permission gate, or user has the permission */
  allowed: boolean;
};

export type DomainCapabilitiesSummary = {
  id: string;
  title: string;
  logosKind?: "song" | "service";
  permissions: readonly PermissionString[];
  tools: Array<{
    name: string;
    permission: PermissionString | null;
    requiresEntitlement: boolean;
    allowed: boolean;
  }>;
  resources: readonly string[];
  prompts: readonly string[];
  skills: readonly string[];
};

function isAllowed(user: RoleUser | null, gate: McpToolGate): boolean {
  if (!gate.permission) return true;
  if (!user?.role) return false;
  return can({ role: user.role as AppRole }, gate.permission);
}

export function summarizeDomainsForUser(user: RoleUser | null): DomainCapabilitiesSummary[] {
  ensureDomainPacksRegistered();
  return listDomainPacks().map((pack) => ({
    id: pack.id,
    title: pack.title,
    logosKind: pack.logosKind,
    permissions: pack.permissions,
    tools: pack.tools.map((gate) => ({
      name: gate.name,
      permission: gate.permission ?? null,
      requiresEntitlement: Boolean(gate.requiresEntitlement),
      allowed: isAllowed(user, gate),
    })),
    resources: pack.resources ?? [],
    prompts: pack.prompts ?? [],
    skills: pack.skills ?? [],
  }));
}

export function toolAvailabilityForUser(user: RoleUser | null): ToolAvailability[] {
  ensureDomainPacksRegistered();
  return listDomainPacks().flatMap((pack) =>
    pack.tools.map((gate) => ({
      name: gate.name,
      domainId: pack.id,
      permission: gate.permission ?? null,
      requiresEntitlement: Boolean(gate.requiresEntitlement),
      allowed: isAllowed(user, gate),
    })),
  );
}

/** Tools the model should prefer (allowed under current role). */
export function allowedToolNames(user: RoleUser | null): string[] {
  return toolAvailabilityForUser(user)
    .filter((t) => t.allowed)
    .map((t) => t.name);
}

export function permissionsReportForUser(opts: {
  orgRole: string | null | undefined;
  appRoles?: readonly AppRoleId[] | null;
  entitled?: boolean;
}): {
  allowed: PermissionString[];
  denied: PermissionString[];
  orgRole: string | null;
  appRoles: AppRoleId[];
  tools: {
    allowed: string[];
    denied: Array<{ name: string; permission: PermissionString; domainId: string }>;
  };
} {
  ensureDomainPacksRegistered();
  const report = resolveEffectivePermissions({
    orgRole: opts.orgRole,
    appRoles: opts.appRoles,
  });

  const user = report.orgRole ? { role: report.orgRole } : null;
  const availability = toolAvailabilityForUser(user);

  return {
    ...report,
    tools: {
      allowed: availability.filter((t) => t.allowed).map((t) => t.name),
      denied: availability
        .filter((t) => !t.allowed && t.permission)
        .map((t) => ({
          name: t.name,
          permission: t.permission!,
          domainId: t.domainId,
        })),
    },
  };
}

/** Flat tool groups for legacy capabilities shape, optionally filtered. */
export function toolGroupsFromPacks(opts?: {
  user?: RoleUser | null;
  /** When true, omit tools the user cannot call. Default false (mark via domains). */
  filterDenied?: boolean;
}): Record<string, string[]> {
  ensureDomainPacksRegistered();
  const filter = Boolean(opts?.filterDenied);
  const user = opts?.user ?? null;
  const groups: Record<string, string[]> = {};
  for (const pack of listDomainPacks()) {
    groups[pack.id] = pack.tools
      .filter((g) => !filter || isAllowed(user, g))
      .map((g) => g.name);
  }
  return groups;
}

export function packCatalogSnapshot(): DomainPack[] {
  ensureDomainPacksRegistered();
  return listDomainPacks();
}

export function assertPackToolsCoverCatalog(catalogNames: readonly string[]): string[] {
  ensureDomainPacksRegistered();
  const packNames = new Set(allPackToolGates().map((t) => t.name));
  return catalogNames.filter((n) => !packNames.has(n));
}
