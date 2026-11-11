/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import type { PermissionString } from "@hosanna/auth";
import type { DomainPack, McpToolGate } from "./types.js";

const packs = new Map<string, DomainPack>();

export function registerDomainPack(pack: DomainPack): void {
  if (packs.has(pack.id)) {
    throw new Error(`Domain pack already registered: ${pack.id}`);
  }
  packs.set(pack.id, pack);
}

export function getDomainPack(id: string): DomainPack | undefined {
  return packs.get(id);
}

export function listDomainPacks(): DomainPack[] {
  return [...packs.values()];
}

/** All tool gates across packs (order = registration order). */
export function allPackToolGates(): McpToolGate[] {
  return listDomainPacks().flatMap((p) => [...p.tools]);
}

export function allPackToolNames(): string[] {
  return allPackToolGates().map((t) => t.name);
}

export function toolGateByName(name: string): McpToolGate | undefined {
  for (const pack of packs.values()) {
    const gate = pack.tools.find((t) => t.name === name);
    if (gate) return gate;
  }
  return undefined;
}

export function packForTool(name: string): DomainPack | undefined {
  for (const pack of packs.values()) {
    if (pack.tools.some((t) => t.name === name)) return pack;
  }
  return undefined;
}

/** Unique permissions declared by any pack. */
export function allPackPermissions(): PermissionString[] {
  const set = new Set<PermissionString>();
  for (const pack of packs.values()) {
    for (const p of pack.permissions) set.add(p);
  }
  return [...set];
}

/** Run every pack's `register` against an MCP server. */
export function registerAllDomainPacks(server: McpServer, authInfo?: AuthInfo): void {
  for (const pack of packs.values()) {
    pack.register?.(server, authInfo);
  }
}

/** Test / hot-reload helper — not used in production. */
export function clearDomainPacks(): void {
  packs.clear();
}
