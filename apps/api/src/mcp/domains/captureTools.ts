import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import type { SuiteAppId } from "@hosanna/auth";
import type { LogosToolDefinition, LogosToolFactory, LogosToolSurface } from "@hosanna/logos-ai/tools";
import type { z } from "zod";

type CapturedResult = { content?: readonly { type: string; text?: string }[] };
type CapturedHandler = (input: unknown) => CapturedResult | Promise<CapturedResult>;
type CapturedRegistration = (
  name: string,
  config: { title?: string; description: string; inputSchema: z.ZodTypeAny },
  handler: CapturedHandler,
) => void;

function resultValue(result: CapturedResult): unknown {
  const text = result.content?.find((block) => block.type === "text")?.text;
  if (text === undefined) return result;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function captureMcpTools(
  register: (server: McpServer, authInfo?: AuthInfo) => void,
  appForTool: SuiteAppId | "suite" | ((name: string) => SuiteAppId | "suite"),
): LogosToolFactory {
  return (context) => {
    const definitions: LogosToolDefinition[] = [];
    const registerTool: CapturedRegistration = (name, config, handler) => {
      const app = typeof appForTool === "function" ? appForTool(name) : appForTool;
      const apps = app === "suite" ? "suite" : [app];
      definitions.push({
        name,
        title: config.title,
        description: config.description,
        inputSchema: config.inputSchema,
        apps,
        execute: async (input) => resultValue(await handler(input)),
      });
    };
    const server = { registerTool } as unknown as McpServer;
    register(server, context.authInfo as AuthInfo | undefined);
    return definitions.filter((definition) => {
      if (definition.surfaces && !definition.surfaces.includes(context.surface as LogosToolSurface)) {
        return false;
      }
      return true;
    });
  };
}
