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
import { registerChordProTools } from "../tools/chordpro.js";
import { registerDiscoveryTools } from "../tools/discovery.js";
import { registerLibraryTools } from "../tools/library.js";
import { registerOrgTools } from "../tools/org.js";
import { registerServiceTools } from "../tools/services.js";
import { registerSongTools } from "../tools/songs.js";
import { ensureDomainPacksRegistered } from "./packs.js";

export function wireHosannaDomainPacks(server: McpServer, authInfo?: AuthInfo): void {
  ensureDomainPacksRegistered();

  // platform.discovery
  registerDiscoveryTools(server, authInfo);
  registerSystemPrompts(server);
  registerResources(server, authInfo);

  // platform.org
  registerOrgTools(server, authInfo);

  // platform.chordpro
  registerChordProTools(server);

  // music.song
  registerSongTools(server, authInfo);
  registerSongPrompts(server);

  // music.service
  registerServiceTools(server, authInfo);
  registerServicePrompts(server);

  // library
  registerLibraryTools(server, authInfo);
}
