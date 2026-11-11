/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A Domain Pack is how MCP (and Logos) learn about a product surface.
 * Register tools/resources/permissions once — discovery and server wiring follow.
 */

import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import type { DomainId, PermissionString } from "@hosanna/auth";

export type McpToolGate = {
  name: string;
  /** Omit for tools that work without org auth (e.g. chordpro_*). */
  permission?: PermissionString;
  /** Writes that need an active subscription. */
  requiresEntitlement?: boolean;
};

export type DomainPack = {
  /** Same id as `@hosanna/auth` DomainId when applicable. */
  id: DomainId | (string & {});
  title: string;
  /** Logos resource kind when proposals apply (`song`, `service`). */
  logosKind?: "song" | "service";
  /** Permissions this domain cares about (for hosanna_permissions). */
  permissions: readonly PermissionString[];
  /** Tools + optional permission gates (for discovery filtering). */
  tools: readonly McpToolGate[];
  /** hosanna:// resource URIs owned by this domain. */
  resources?: readonly string[];
  prompts?: readonly string[];
  skills?: readonly string[];
  /** Register MCP tools/resources for this pack. */
  register?: (server: McpServer, authInfo?: AuthInfo) => void;
};
