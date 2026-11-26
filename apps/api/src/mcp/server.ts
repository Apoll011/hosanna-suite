// SPDX-License-Identifier: AGPL-3.0-only
import type { AuthInfo } from "@modelcontextprotocol/server";
import { McpServer } from "@modelcontextprotocol/server";
import { wireHosannaDomainPacks } from "./domains/index.js";
import { buildHosannaMcpInstructions } from "./instructions.js";
import { HOSANNA_MCP_VERSION } from "./version.js";

export const MCP_SERVER_INFO = {
  name: "hosanna",
  version: HOSANNA_MCP_VERSION,
} as const;

/**
 * External MCP server (ChatGPT / Claude / …).
 * Studio-only tools (studio_sync, navigate, PDF, search) are NOT registered here —
 * they exist only on the Hosanna Studio embedded assistant.
 *
 * Domains mount via {@link wireHosannaDomainPacks} from factories in domains/packs.ts.
 */
export function createHosannaMcpServer(authInfo?: AuthInfo): McpServer {
  const server = new McpServer(MCP_SERVER_INFO, {
    instructions: buildHosannaMcpInstructions(),
  });

  wireHosannaDomainPacks(server, authInfo);

  return server;
}
