/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Product domains map 1:1 onto permission resources (`song.update`) and Logos
 * resource kinds (`song`). New suite products register a domain here first —
 * then MCP packs and Logos resources reuse the same id.
 */

import type { PermissionString, Resource } from "./permission.js";
import { statement } from "./permission.js";

/** Stable product-domain ids (suite apps own one or more). */
export type DomainId =
  | "music.song"
  | "music.service"
  | "library.folder"
  | "library.collection"
  | "library.agenda"
  | "platform.settings"
  | "platform.ai"
  | "platform.billing"
  | "platform.backup"
  | "platform.notification"
  | "platform.export"
  | "platform.library";

/** Suite app ids from FUTURE_DIRECTION (auth is the account hub). */
export type SuiteAppId =
  | "auth"
  | "music"
  | "planning"
  | "finance"
  | "presenter"
  | "community"
  | "platform";

export type DomainDefinition = {
  id: DomainId;
  /** Better Auth statement resource (`song`, `service`, …). */
  permissionResource: Resource;
  /** Owning suite app (Music owns songs; Planning will own services later). */
  app: SuiteAppId;
  /** Logos catalog / proposal kind when this domain is editable in chat. */
  logosKind?: "song" | "service";
  title: string;
};

/**
 * Canonical domain catalog. Permission strings remain `{resource}.{action}`
 * (e.g. `song.update`); `DomainId` is the product grouping for packs + Logos.
 */
export const DOMAINS: readonly DomainDefinition[] = [
  {
    id: "music.song",
    permissionResource: "song",
    app: "music",
    logosKind: "song",
    title: "Songs",
  },
  {
    id: "music.service",
    permissionResource: "service",
    app: "planning",
    logosKind: "service",
    title: "Services",
  },
  {
    id: "library.folder",
    permissionResource: "folder",
    app: "music",
    title: "Folders",
  },
  {
    id: "library.collection",
    permissionResource: "collection",
    app: "music",
    title: "Collections",
  },
  {
    id: "library.agenda",
    permissionResource: "agenda",
    app: "planning",
    title: "Agenda",
  },
  {
    id: "platform.settings",
    permissionResource: "settings",
    app: "platform",
    title: "Settings",
  },
  {
    id: "platform.ai",
    permissionResource: "ai",
    app: "platform",
    title: "AI",
  },
  {
    id: "platform.billing",
    permissionResource: "billing",
    app: "platform",
    title: "Billing",
  },
  {
    id: "platform.backup",
    permissionResource: "backup",
    app: "platform",
    title: "Backup",
  },
  {
    id: "platform.notification",
    permissionResource: "notification",
    app: "platform",
    title: "Notifications",
  },
  {
    id: "platform.export",
    permissionResource: "export",
    app: "platform",
    title: "Export",
  },
  {
    id: "platform.library",
    permissionResource: "library",
    app: "platform",
    title: "Library health",
  },
] as const;

const byId = new Map(DOMAINS.map((d) => [d.id, d]));
const byResource = new Map(DOMAINS.map((d) => [d.permissionResource, d]));
const byLogosKind = new Map(
  DOMAINS.filter((d) => d.logosKind).map((d) => [d.logosKind!, d]),
);

export function getDomain(id: DomainId): DomainDefinition | undefined {
  return byId.get(id);
}

export function domainForPermissionResource(resource: Resource): DomainDefinition | undefined {
  return byResource.get(resource);
}

export function domainForLogosKind(kind: string): DomainDefinition | undefined {
  return byLogosKind.get(kind as "song" | "service");
}

export function domainIdForPermission(permission: PermissionString): DomainId | null {
  const resource = permission.slice(0, permission.indexOf(".")) as Resource;
  return byResource.get(resource)?.id ?? null;
}

/** Every `resource.action` permission string for a domain. */
export function permissionsForDomain(id: DomainId): PermissionString[] {
  const domain = byId.get(id);
  if (!domain) return [];
  const actions = statement[domain.permissionResource];
  return actions.map((action) => `${domain.permissionResource}.${action}` as PermissionString);
}

/** All Hosanna custom permission strings (excludes Better Auth org defaults like member.*). */
export function allDomainPermissions(): PermissionString[] {
  return DOMAINS.flatMap((d) => permissionsForDomain(d.id));
}

export function logosKindForDomain(id: DomainId): "song" | "service" | undefined {
  return byId.get(id)?.logosKind;
}
