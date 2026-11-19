import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import type { LogosToolDefinition } from "@hosanna/logos-ai/tools";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { ensureDomainPacksRegistered } from "./packs.js";
import { listDomainPacks } from "./registry.js";

function asText(value: unknown): unknown {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function zodSchema(definition: LogosToolDefinition): z.ZodTypeAny {
  return definition.inputSchema instanceof z.ZodType
    ? definition.inputSchema
    : z.object({});
}

export function createSharedEmbeddedTools(
  authInfo: AuthInfo,
  context: Record<string, unknown> = {},
): ToolSet {
  ensureDomainPacksRegistered();
  const tools: ToolSet = {};

  for (const pack of listDomainPacks()) {
    if (!pack.toolFactory) continue;
    for (const definition of pack.toolFactory({ ...context, authInfo, surface: "embedded" })) {
      if (definition.surfaces && !definition.surfaces.includes("embedded")) continue;
      const schema = zodSchema(definition);
      tools[definition.name] = tool({
        description: definition.description,
        inputSchema: schema,
        execute: async (input: unknown) => asText(await definition.execute(input)),
      }) as ToolSet[string];
    }
  }

  return tools;
}

export function mountSharedDomainTools(server: McpServer, authInfo?: AuthInfo): void {
  ensureDomainPacksRegistered();

  for (const pack of listDomainPacks()) {
    if (!pack.toolFactory) continue;
    for (const definition of pack.toolFactory({ authInfo, surface: "mcp" })) {
      if (definition.surfaces && !definition.surfaces.includes("mcp")) continue;
      server.registerTool(
        definition.name,
        {
          title: definition.title,
          description: definition.description,
          inputSchema: zodSchema(definition),
        },
        async (input) => ({
          content: [{ type: "text" as const, text: String(asText(await definition.execute(input))) }],
        }),
      );
    }
  }
}
