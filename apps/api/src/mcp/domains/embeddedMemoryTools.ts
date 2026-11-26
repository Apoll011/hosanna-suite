// SPDX-License-Identifier: AGPL-3.0-only
import type { AuthInfo } from "@modelcontextprotocol/server";
import type { LogosToolDefinition, LogosToolFactory } from "@hosanna/logos-ai/tools";
import { z } from "zod";
import { requireMcpContext } from "../context.js";
import { AI_LIMITS } from "../../services/aiBehavior.js";
import { AiMemoryService } from "../../services/aiMemory.service.js";

const listSchema = z.object({
  scope: z.enum(["organization", "personal", "all"]).optional(),
});
const saveSchema = z.object({
  content: z.string().min(1).max(AI_LIMITS.memoryEntryMaxChars),
  scope: z.enum(["organization", "personal"]).optional(),
});
const forgetSchema = z.object({
  id: z.string().min(1),
  scope: z.enum(["organization", "personal"]).optional(),
});

function definition<Schema extends z.ZodTypeAny>(
  options: {
    name: string;
    description: string;
    inputSchema: Schema;
    execute: (
      input: z.infer<Schema>,
      memory: AiMemoryService,
      authInfo: AuthInfo,
    ) => unknown | Promise<unknown>;
  },
  memory: AiMemoryService,
  authInfo: AuthInfo,
): LogosToolDefinition {
  return {
    name: options.name,
    description: options.description,
    inputSchema: options.inputSchema,
    apps: "suite",
    surfaces: ["embedded"],
    execute: (input) => options.execute(options.inputSchema.parse(input), memory, authInfo),
  };
}

export const embeddedMemoryToolFactory: LogosToolFactory = (factoryContext) => {
  const memory = factoryContext.memory;
  const authInfo = factoryContext.authInfo;
  if (!(memory instanceof AiMemoryService) || !authInfo || typeof authInfo !== "object") return [];
  return [
    definition(
      {
        name: "memory_list",
        description: "List saved organization and personal memory entries.",
        inputSchema: listSchema,
        execute: async ({ scope }, memoryService, info) => {
          const context = requireMcpContext(info);
          const userId = context.user?.id;
          if (!userId || scope === "organization") {
            return { items: await memoryService.listOrg(context.orgId) };
          }
          if (scope === "personal") {
            return { items: await memoryService.listPersonal(userId) };
          }
          return { items: await memoryService.listForChat(context.orgId, userId) };
        },
      },
      memory,
      authInfo as AuthInfo,
    ),
    definition(
      {
        name: "memory_save",
        description:
          "Save one short, durable fact or preference when the user explicitly asks you to remember it.",
        inputSchema: saveSchema,
        execute: async ({ content, scope }, memoryService, info) => {
          const context = requireMcpContext(info);
          if (scope === "personal") {
            const userId = context.user?.id;
            if (!userId)
              return { saved: false, error: "No authenticated user for personal memory." };
            const saved = await memoryService.addPersonal(userId, content, { source: "ai" });
            return {
              saved: !saved.duplicate,
              alreadyKnown: saved.duplicate,
              id: saved.id,
              content: saved.content,
              scope: saved.scope,
            };
          }
          const saved = await memoryService.addOrg(context.orgId, content, {
            source: "ai",
            userId: context.user?.id,
          });
          return {
            saved: !saved.duplicate,
            alreadyKnown: saved.duplicate,
            id: saved.id,
            content: saved.content,
            scope: saved.scope,
          };
        },
      },
      memory,
      authInfo as AuthInfo,
    ),
    definition(
      {
        name: "memory_forget",
        description: "Remove a memory entry by id when the user asks you to forget it.",
        inputSchema: forgetSchema,
        execute: async ({ id, scope }, memoryService, info) => {
          const context = requireMcpContext(info);
          if (scope === "personal") {
            const userId = context.user?.id;
            if (!userId) return { removed: false };
            return { removed: await memoryService.removePersonal(userId, id) };
          }
          return { removed: await memoryService.removeOrg(context.orgId, id) };
        },
      },
      memory,
      authInfo as AuthInfo,
    ),
  ];
};
