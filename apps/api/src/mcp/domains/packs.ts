/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Canonical MCP domain pack metadata. Tool mounting lives in `wire.ts`
 * (static imports) so discovery can read packs without a module cycle.
 */

import { permissionsForDomain } from "@hosanna/auth";
import { MCP_TOOL_GROUPS } from "../lib/toolCatalog.js";
import { registerDomainPack } from "./registry.js";
import type { DomainPack, McpToolGate } from "./types.js";

const DISCOVERY_TOOLS = [
  "hosanna_capabilities",
  "hosanna_permissions",
  "hosanna_skills_list",
  "hosanna_skill_read",
  "hosanna_resources_list",
  "hosanna_resource_read",
] as const;

const ORG_TOOLS = [
  "me",
  "members_list",
  "members_get",
  "members_resolve",
  "members_invite",
  "org_get",
] as const;

function gates(
  names: readonly string[],
  permission?: McpToolGate["permission"],
  requiresEntitlement?: boolean,
): McpToolGate[] {
  return names.map((name) => ({
    name,
    ...(permission ? { permission } : {}),
    ...(requiresEntitlement ? { requiresEntitlement } : {}),
  }));
}

function songToolGates(): McpToolGate[] {
  const read = new Set([
    "songs_search",
    "songs_list_in_folder",
    "songs_search_lyrics",
    "songs_get",
    "songs_get_many",
    "songs_find_duplicates",
    "songs_validate_many",
  ]);
  const create = new Set(["songs_create_draft"]);
  const update = new Set([
    "songs_propose_edit",
    "songs_propose_fix",
    "songs_propose_transpose",
    "songs_draft_propagate_chords",
    "songs_save",
    "songs_move",
    "songs_restore",
  ]);
  const del = new Set(["songs_delete"]);
  return MCP_TOOL_GROUPS.songs.map((name) => {
    if (read.has(name)) return { name, permission: "song.access" as const };
    if (create.has(name))
      return { name, permission: "song.create" as const, requiresEntitlement: true };
    if (update.has(name))
      return { name, permission: "song.update" as const, requiresEntitlement: true };
    if (del.has(name))
      return { name, permission: "song.delete" as const, requiresEntitlement: true };
    return { name, permission: "song.access" as const };
  });
}

function serviceToolGates(): McpToolGate[] {
  const read = new Set([
    "services_search",
    "services_get",
    "services_get_many",
    "services_validate",
    "services_plan_suggest",
  ]);
  const create = new Set(["services_create_draft", "services_publish"]);
  const update = new Set(["services_propose_edit", "services_save", "services_restore"]);
  const del = new Set(["services_delete"]);
  return MCP_TOOL_GROUPS.services.map((name) => {
    if (read.has(name)) return { name, permission: "service.access" as const };
    if (create.has(name))
      return { name, permission: "service.create" as const, requiresEntitlement: true };
    if (update.has(name))
      return { name, permission: "service.update" as const, requiresEntitlement: true };
    if (del.has(name))
      return { name, permission: "service.delete" as const, requiresEntitlement: true };
    return { name, permission: "service.access" as const };
  });
}

function libraryToolGates(): McpToolGate[] {
  return MCP_TOOL_GROUPS.library.map((name): McpToolGate => {
    if (name.startsWith("folders_")) {
      if (name === "folders_list") return { name, permission: "folder.access" };
      if (name === "folders_create")
        return { name, permission: "folder.create", requiresEntitlement: true };
      if (name === "folders_delete")
        return { name, permission: "folder.delete", requiresEntitlement: true };
      return { name, permission: "folder.update", requiresEntitlement: true };
    }
    if (name.startsWith("collections_")) {
      if (name === "collections_list" || name === "collections_get")
        return { name, permission: "collection.access" };
      if (name === "collections_create")
        return { name, permission: "collection.create", requiresEntitlement: true };
      if (name === "collections_delete")
        return { name, permission: "collection.delete", requiresEntitlement: true };
      return { name, permission: "collection.update", requiresEntitlement: true };
    }
    if (name.startsWith("agenda_")) {
      if (name === "agenda_list" || name === "agenda_get")
        return { name, permission: "agenda.access" };
      if (name === "agenda_create")
        return { name, permission: "agenda.create", requiresEntitlement: true };
      if (name === "agenda_delete")
        return { name, permission: "agenda.delete", requiresEntitlement: true };
      return { name, permission: "agenda.update", requiresEntitlement: true };
    }
    if (name.startsWith("trash_") || name === "library_overview") {
      return { name, permission: "song.access" };
    }
    return { name, permission: "song.access" };
  });
}

/** Pack definitions (metadata). Mounting is in wire.ts. */
export const DOMAIN_PACKS: readonly DomainPack[] = [
  {
    id: "platform.discovery",
    title: "Discovery",
    permissions: [],
    tools: gates([...DISCOVERY_TOOLS]),
    resources: ["hosanna://ops/catalog"],
    prompts: ["hosanna_system"],
    skills: ["hosanna://skills/hosanna-safe-data"],
  },
  {
    id: "platform.org",
    title: "Organization",
    permissions: [],
    tools: gates([...ORG_TOOLS]),
  },
  {
    id: "platform.chordpro",
    title: "ChordPro",
    permissions: [],
    tools: gates([...MCP_TOOL_GROUPS.chordpro]),
    resources: [
      "hosanna://chordpro/guide",
      "hosanna://chordpro/directives",
      "hosanna://chordpro/features",
    ],
  },
  {
    id: "music.song",
    title: "Songs",
    logosKind: "song",
    permissions: permissionsForDomain("music.song"),
    tools: songToolGates(),
    resources: ["hosanna://domain/songs", "hosanna://schemas/song"],
    prompts: [
      "songs_create",
      "songs_edit",
      "songs_fix",
      "songs_complete",
      "songs_review",
      "songs_transpose",
      "songs_arrange",
      "songs_explain_chordpro",
    ],
    skills: [
      "hosanna://skills/chordpro-create",
      "hosanna://skills/songs-edit-fix",
      "hosanna://skills/chordpro-directives-variants",
      "hosanna://skills/songs-transpose-arrange",
      "hosanna://skills/songs-validate-review",
    ],
  },
  {
    id: "music.service",
    title: "Services",
    logosKind: "service",
    permissions: permissionsForDomain("music.service"),
    tools: serviceToolGates(),
    resources: [
      "hosanna://domain/services",
      "hosanna://schemas/service",
      "hosanna://schemas/service-element-types",
    ],
    prompts: [
      "services_create",
      "services_edit",
      "services_complete",
      "services_fix",
      "services_review",
      "services_plan",
    ],
    skills: ["hosanna://skills/services-create-edit", "hosanna://skills/services-plan-complete"],
  },
  {
    id: "library",
    title: "Library",
    permissions: [
      ...permissionsForDomain("library.folder"),
      ...permissionsForDomain("library.collection"),
      ...permissionsForDomain("library.agenda"),
    ],
    tools: libraryToolGates(),
    resources: ["hosanna://domain/library"],
  },
];

let registered = false;

/** Idempotent — publish pack metadata into the registry. */
export function ensureDomainPacksRegistered(): void {
  if (registered) return;
  registered = true;
  for (const pack of DOMAIN_PACKS) registerDomainPack(pack);
}
