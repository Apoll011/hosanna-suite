import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import type { PermissionString, SuiteAppId } from "@hosanna/auth";
import type { LogosToolDefinition, LogosToolSurface } from "@hosanna/logos-ai/tools";
import { tool, type ToolSet } from "ai";
import type { z } from "zod";
import { requireMcpContext, requirePermission, requireWriteEntitlement } from "../context.js";
import { STUDIO_ONLY_TOOLS } from "../lib/toolCatalog.js";
import { ensureDomainPacksRegistered } from "./packs.js";
import { listDomainPacks } from "./registry.js";

const STUDIO_ONLY = new Set<string>(STUDIO_ONLY_TOOLS);
const SUITE_APP_IDS = new Set<SuiteAppId>([
  "auth",
  "music",
  "planning",
  "finance",
  "presenter",
  "community",
  "platform",
]);

function suiteAppId(value: unknown): SuiteAppId | undefined {
  return typeof value === "string" && SUITE_APP_IDS.has(value as SuiteAppId)
    ? (value as SuiteAppId)
    : undefined;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function schemaOf(d: LogosToolDefinition): z.ZodTypeAny {
  const s = d.inputSchema as z.ZodTypeAny | undefined;
  if (!s || typeof s.safeParse !== "function") {
    throw new Error(`Shared tool "${d.name}" needs a zod inputSchema`);
  }
  return s;
}

/** Enforces the definition's permission/entitlement so no surface can skip it. */
function gated(d: LogosToolDefinition, authInfo?: AuthInfo) {
  return async (input: unknown) => {
    if (d.permission || d.requiresEntitlement) {
      const ctx = requireMcpContext(authInfo);
      if (d.permission) requirePermission(ctx, d.permission as PermissionString);
      if (d.requiresEntitlement) requireWriteEntitlement(ctx);
    }
    return d.execute(input);
  };
}

function collect(
  surface: LogosToolSurface,
  authInfo: AuthInfo | undefined,
  context: Record<string, unknown>,
  reserved: Iterable<string>,
): LogosToolDefinition[] {
  ensureDomainPacksRegistered();
  const seen = new Set(reserved);
  const out: LogosToolDefinition[] = [];
  for (const pack of listDomainPacks()) {
    if (!pack.toolFactory) continue;
    for (const d of pack.toolFactory({ ...context, owningApp: pack.app, authInfo, surface })) {
      if (d.surfaces && !d.surfaces.includes(surface)) continue;
      if (d.ui && surface !== "embedded") continue;
      if (
        d.requiresCapabilities?.some(
          (capability) =>
            !Array.isArray(context.capabilities) || !context.capabilities.includes(capability),
        )
      ) {
        continue;
      }
      if (surface === "embedded") {
        const apps = d.apps ?? pack.app;
        const appId = suiteAppId(context.appId);
        if (apps !== "suite" && (!apps || !appId || !apps.includes(appId))) continue;
      }
      if (surface === "mcp" && STUDIO_ONLY.has(d.name)) {
        throw new Error(`Studio-only tool "${d.name}" must declare surfaces: ["embedded"]`);
      }
      if (seen.has(d.name)) throw new Error(`Duplicate tool name: ${d.name}`);
      seen.add(d.name);
      const gate = pack.tools.find((toolGate) => toolGate.name === d.name);
      const definition = {
        ...d,
        permission: d.permission ?? gate?.permission,
        requiresEntitlement: d.requiresEntitlement ?? gate?.requiresEntitlement,
      };
      out.push({
        ...definition,
        inputSchema: schemaOf(definition),
        execute: gated(definition, authInfo),
      });
    }
  }
  return out;
}

/** `reserved`: names already in the embedded tool set (collisions throw instead of overriding). */
export function createSharedEmbeddedTools(
  authInfo: AuthInfo,
  context: Record<string, unknown> = {},
  reserved: Iterable<string> = [],
): ToolSet {
  const tools: ToolSet = {};
  for (const d of collect("embedded", authInfo, context, reserved)) {
    tools[d.name] = tool({
      description: d.description,
      inputSchema: schemaOf(d),
      execute: async (input: unknown) => asText(await d.execute(input)),
    }) as ToolSet[string];
  }
  return tools;
}

export function mountSharedDomainTools(server: McpServer, authInfo?: AuthInfo): void {
  for (const d of collect("mcp", authInfo, {}, [])) {
    server.registerTool(
      d.name,
      { title: d.title, description: d.description, inputSchema: schemaOf(d) },
      async (input) => ({
        content: [{ type: "text" as const, text: asText(await d.execute(input)) }],
      }),
    );
  }
}
