import type { AuthInfo } from "@modelcontextprotocol/server";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { errorResult, jsonResult, requireMcpContext } from "../context.js";
import {
  getMe,
  getMember,
  getOrganization,
  inviteMember,
  listMembers,
  resolveMembers,
} from "../lib/orgDirectory.js";

export function registerOrgTools(server: McpServer, authInfo?: AuthInfo): void {
  server.registerTool(
    "me",
    {
      title: "Who am I",
      description:
        'Return the authenticated user (id, name, email), org membership (memberId, role), and active organization. Use before assigning agenda responsibilities to "me".',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return jsonResult(await getMe(requireMcpContext(authInfo)));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "members_list",
    {
      title: "List organization members",
      description:
        "List members of the active organization (memberId, userId, name, email, role). Use to optionally link agenda assignees; name-only assignees do not require a member row.",
      inputSchema: z.object({
        search: z.string().optional().describe("Filter by name or email (case-insensitive)"),
        role: z.string().optional().describe("Filter by org role (owner, admin, musician, …)"),
        limit: z.number().int().positive().max(200).optional().default(100),
      }),
    },
    async (args) => {
      try {
        return jsonResult(await listMembers(requireMcpContext(authInfo), args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "members_get",
    {
      title: "Get organization member",
      description:
        "Look up one member by memberId, userId, or name (partial). Optional helper for linking assignee.memberId when the person already has an account.",
      inputSchema: z.object({
        memberId: z.string().optional(),
        userId: z.string().optional(),
        name: z.string().optional().describe("Partial name match"),
      }),
    },
    async (args) => {
      try {
        return jsonResult(await getMember(requireMcpContext(authInfo), args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "members_resolve",
    {
      title: "Resolve member names",
      description:
        "Optional helper: map people names to memberIds when they exist. Unresolved → nameOnlyOk=true; still assign by name on the agenda. Never refuse agenda work. After everything is saved you may mention who has no account — do not mix this with members_invite.",
      inputSchema: z.object({
        names: z
          .array(
            z.object({
              name: z.string().min(1),
              category: z
                .string()
                .optional()
                .describe("Optional responsibility categoryId for context"),
            }),
          )
          .min(1)
          .max(40),
      }),
    },
    async ({ names }) => {
      try {
        return jsonResult(await resolveMembers(requireMcpContext(authInfo), names));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "members_invite",
    {
      title: "Invite organization member",
      description:
        "Standalone org tool: invite someone by email via the auth app (sends the invitation email). Independent of agenda — never required for event assignments. Call only when the user explicitly wants to invite someone.",
      inputSchema: z.object({
        email: z.string().email(),
        name: z.string().optional().describe("Display name hint for the invitee"),
        role: z
          .string()
          .optional()
          .default("musician")
          .describe("Org role: musician, editor, admin, guest, …"),
        resend: z
          .boolean()
          .optional()
          .describe("If an invite is already pending, resend the email (default: auto when pending)"),
      }),
    },
    async (args) => {
      try {
        return jsonResult(await inviteMember(requireMcpContext(authInfo), args));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "org_get",
    {
      title: "Get active organization",
      description:
        "Return active org profile: name, slug, locale, timezone, and agenda responsibilityCategories (leader, musicians, preacher, …). No org switch — session stays on the current org.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return jsonResult(await getOrganization(requireMcpContext(authInfo)));
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
