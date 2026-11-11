import type { AuthInfo, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getChordProCapabilities } from "../lib/capabilities.js";
import {
  DOC_RESOURCES,
  docsAccessReport,
  listResources,
  listSkills,
  readDoc,
  readSkill,
  SKILL_NAMES,
} from "../lib/docsAccess.js";
import { STUDIO_UI_CATALOG } from "../lib/studioUi.js";
import { errorResult, getMcpContext, jsonResult } from "../context.js";
import { HOSANNA_MCP_VERSION } from "../version.js";
import {
  MCP_TOOL_GROUPS,
  ALL_MCP_TOOL_NAMES,
  STUDIO_ONLY_TOOLS,
  TOOL_SURFACE,
} from "../lib/toolCatalog.js";
import { recentToolTimings, toolTimingSummary } from "../lib/toolMetrics.js";
import { createSongSchema } from "../../validators/song.validators.js";
import { createServiceSchema } from "../../validators/service.validators.js";
import {
  serviceElementSchema,
  serviceElementTypeSchema,
} from "../../validators/serviceElement.validators.js";
import { permissionsReportForUser, summarizeDomainsForUser } from "../domains/discovery.js";
import { ensureDomainPacksRegistered } from "../domains/packs.js";

function zToRoughJson(schema: { description?: string; _def?: unknown }) {
  return {
    description: schema.description ?? null,
    def: schema._def ?? null,
  };
}

export function registerDiscoveryTools(server: McpServer, authInfo?: AuthInfo): void {
  ensureDomainPacksRegistered();

  server.registerTool(
    "hosanna_capabilities",
    {
      title: "Hosanna capabilities",
      description:
        "Summarize Hosanna MCP tools, resources, prompts, domain packs, and ChordPro feature support. When authenticated, each domain tool is marked allowed/denied for the current role.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const chordpro = getChordProCapabilities();
        const ctx = getMcpContext(authInfo);
        const user = ctx?.user ?? null;
        const domains = summarizeDomainsForUser(user);
        const allowedToolCount = domains.reduce(
          (n, d) => n + d.tools.filter((t) => t.allowed).length,
          0,
        );
        return jsonResult({
          server: {
            name: "hosanna",
            version: HOSANNA_MCP_VERSION,
            toolCount: ALL_MCP_TOOL_NAMES.length,
            allowedToolCount: user ? allowedToolCount : null,
          },
          architecture: {
            core: TOOL_SURFACE.core,
            studioOnly: TOOL_SURFACE.studioOnly,
            studioOnlyTools: [...STUDIO_ONLY_TOOLS],
            note: "This MCP server exposes CORE tools only. Studio-only tools are unavailable here. Domains are registered via MCP Domain Packs.",
          },
          domains,
          tools: {
            ...MCP_TOOL_GROUPS,
            services: [
              ...MCP_TOOL_GROUPS.services.map((name) =>
                name === "services_search" ? "services_search (archived / includeArchived)" : name,
              ),
            ],
          },
          resources: listResources().map((r) => r.uri),
          observability: {
            note: "Timed tools attach _meta.durationMs. Samples are in-process only.",
            ...toolTimingSummary(),
            recent: recentToolTimings(10),
          },
          prompts: Object.fromEntries(
            domains.filter((d) => d.prompts.length > 0).map((d) => [d.id, [...d.prompts]]),
          ),
          skills: domains.flatMap((d) => [...d.skills]),
          chordproFeatures: chordpro.features,
          studioUi: STUDIO_UI_CATALOG,
          notes: [
            "Prefer domains[].tools where allowed=true for the current role; denied tools will fail requirePermission.",
            "Server instructions tell you to READ skill resources — they are not auto-injected into context.",
            "Start with prompt hosanna_system (or read hosanna://skills/hosanna-safe-data + job skills).",
            "Org-scoped song/service tools require Better Auth bearer session with activeOrganizationId.",
            "Use draft/propose tools first; persist only with songs_save / services_save after user approval.",
            "Never fabricate lyrics. Instrument diagrams are client-render-only.",
            "Folder/collection icon and color must use studioUi ids (or hosanna://domain/library).",
            "Agenda assignees need only name; memberId is optional for existing org members. Do not refuse name-only people.",
            "All tool names use snake_case (underscores), never dots.",
          ],
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "hosanna_permissions",
    {
      title: "Current permissions",
      description:
        "Return the authenticated org role, effective domain permissions (allowed/denied), and which MCP tools those permissions unlock.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const ctx = getMcpContext(authInfo);
        if (!ctx) {
          return jsonResult({
            authenticated: false,
            message:
              "Not authenticated. ChordPro tools still work; song/service tools require a session.",
          });
        }
        const report = permissionsReportForUser({
          orgRole: ctx.user.role,
          entitled: ctx.entitled,
        });
        return jsonResult({
          authenticated: true,
          userId: ctx.user.id,
          orgId: ctx.orgId,
          role: ctx.user.role,
          orgRole: report.orgRole,
          appRoles: report.appRoles,
          teamId: ctx.user.teamId ?? null,
          entitled: ctx.entitled,
          locale: ctx.locale,
          permissions: report.allowed,
          denied: report.denied,
          tools: report.tools,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "hosanna_skills_list",
    {
      title: "List skills",
      description:
        "List Hosanna skill documents (hosanna://skills/*) with on-disk existence and a short preview. Read full text with hosanna_skill_read.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return jsonResult({
          skills: listSkills(),
          access: docsAccessReport(),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "hosanna_skill_read",
    {
      title: "Read skill",
      description:
        "Read the full SKILL.md body for a skill name (e.g. hosanna-safe-data or hosanna://skills/hosanna-safe-data).",
      inputSchema: z.object({
        name: z.string().describe(`One of: ${SKILL_NAMES.join(", ")}`),
      }),
    },
    async ({ name }) => {
      try {
        const skill = readSkill(name);
        return jsonResult({
          name: skill.name,
          uri: skill.uri,
          mimeType: "text/markdown",
          bytes: Buffer.byteLength(skill.text, "utf8"),
          text: skill.text,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "hosanna_resources_list",
    {
      title: "List resources",
      description: "List readable hosanna:// resource URIs (docs + skills).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        return jsonResult({ resources: listResources() });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "hosanna_resource_read",
    {
      title: "Read resource",
      description:
        "Read a hosanna:// resource by URI (skills, chordpro guide/features, domain docs, examples).",
      inputSchema: z.object({
        uri: z.string().describe("e.g. hosanna://chordpro/guide"),
      }),
    },
    async ({ uri }) => {
      try {
        const trimmed = uri.trim();
        if (trimmed.startsWith("hosanna://skills/")) {
          const skill = readSkill(trimmed);
          return jsonResult({
            uri: skill.uri,
            mimeType: "text/markdown",
            text: skill.text,
          });
        }
        const caps = getChordProCapabilities();
        if (trimmed === "hosanna://chordpro/directives") {
          return jsonResult({
            uri: trimmed,
            mimeType: "application/json",
            text: JSON.stringify(caps.directives, null, 2),
          });
        }
        if (trimmed === "hosanna://chordpro/features") {
          return jsonResult({
            uri: trimmed,
            mimeType: "application/json",
            text: JSON.stringify(caps.features, null, 2),
          });
        }
        if (trimmed === "hosanna://ops/catalog") {
          return jsonResult({
            uri: trimmed,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                tools: "see hosanna_capabilities",
                resources: listResources(),
                skills: SKILL_NAMES,
              },
              null,
              2,
            ),
          });
        }
        if (trimmed === "hosanna://schemas/song") {
          return jsonResult({
            uri: trimmed,
            mimeType: "application/json",
            text: JSON.stringify(zToRoughJson(createSongSchema), null, 2),
          });
        }
        if (trimmed === "hosanna://schemas/service") {
          return jsonResult({
            uri: trimmed,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                service: zToRoughJson(createServiceSchema),
                element: zToRoughJson(serviceElementSchema),
              },
              null,
              2,
            ),
          });
        }
        if (trimmed === "hosanna://schemas/service-element-types") {
          return jsonResult({
            uri: trimmed,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                types: serviceElementTypeSchema.options,
                fields: {
                  song: ["id", "type", "title", "songId", "duration", "notes"],
                  scripture: ["id", "type", "title", "passage", "content", "duration", "notes"],
                  other: ["id", "type", "title", "content", "duration", "notes"],
                },
                durationUnit: "seconds",
              },
              null,
              2,
            ),
          });
        }
        const entry = DOC_RESOURCES.find((r) => r.uri === trimmed);
        if (!entry?.relativePath) {
          return jsonResult(
            {
              error: true,
              code: "not_found",
              message: `Unknown resource ${trimmed}`,
              hint: "Call hosanna_resources_list",
            },
            true,
          );
        }
        const text = readDoc(entry.relativePath);
        return jsonResult({
          uri: trimmed,
          mimeType:
            entry.kind === "chordpro"
              ? "text/vnd.chordpro"
              : entry.kind === "json"
                ? "application/json"
                : "text/markdown",
          text,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
