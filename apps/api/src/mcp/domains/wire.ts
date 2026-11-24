/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mount every domain pack onto an MCP server. Static imports keep registration
 * synchronous (same guarantees as the pre-pack server.ts).
 */

import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import { registerServicePrompts } from "../prompts/services.js";
import { registerSongPrompts } from "../prompts/songs.js";
import { registerSystemPrompts } from "../prompts/system.js";
import { registerResources } from "../resources/catalog.js";
import { ensureDomainPacksRegistered } from "./packs.js";
import { mountSharedDomainTools } from "./toolFactory.js";

export function wireHosannaDomainPacks(server: McpServer, authInfo?: AuthInfo): void {
  ensureDomainPacksRegistered();

  // platform.discovery
  registerSystemPrompts(server);
  registerResources(server, authInfo);

  // platform.org
  registerSongPrompts(server);
  registerServicePrompts(server);

  mountSharedDomainTools(server, authInfo);
}
