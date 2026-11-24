import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { formatChordPro } from "@hosanna/chordpro/formatter";
import { convertToChordProDetailed, lintChordPro, parseChordPro } from "@hosanna/chordpro/parser";
import type { AuthInfo } from "@modelcontextprotocol/server";
import {
  APICallError,
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type ModelMessage,
  type ToolSet,
  type UIMessage,
} from "ai";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  AI_LIMITS,
  customInstructionsPromptBlock,
  MEMORY_USAGE_PROMPT,
  memoryPromptBlock,
  toolBudgetNotice,
  type ToolBudgetState,
} from "./aiBehavior.js";
import { AiMemoryService } from "./aiMemory.service.js";
import {
  folders as folderService,
  getMcpContext,
  requireMcpContext,
  requirePermission,
  requireWriteEntitlement,
  services as serviceService,
  songs as songService,
} from "../mcp/context.js";
import { explainChordProDirective, getChordProCapabilities } from "../mcp/lib/capabilities.js";
import {
  DOC_RESOURCES,
  docsAccessReport,
  listResources,
  listSkills,
  readDoc,
  readSkill,
  SKILL_NAMES,
} from "../mcp/lib/docsAccess.js";
import {
  durationSecondsFromChordPro,
  metadataFromChordPro,
  mirroredMetadataWarnings,
  validateChordProContent,
} from "../mcp/lib/chordproGate.js";
import { clipContent, FULL_CONTENT_MAX, SEARCH_CONTENT_MAX } from "../mcp/lib/contentClip.js";
import { summarizeDiff } from "../mcp/lib/diff.js";
import { withClientRequestId } from "../mcp/lib/idempotency.js";
import {
  collectionAddSongs,
  collectionRemoveSongs,
  createAgendaEvent,
  createCollection,
  createFolder,
  getAgendaEvent,
  getCollection,
  listAgenda,
  listCollections,
  listFolders,
  updateAgendaEvent,
  updateCollection,
  updateFolder,
} from "../mcp/lib/libraryCrud.js";
import { FOLDER_SONGS_MAX_LIMIT, listSongsInFolder } from "../mcp/lib/folderSongs.js";
import { searchMusicBrainzRecordings } from "../mcp/lib/musicbrainz.js";
import { propagateVerseChords } from "../mcp/lib/propagateChords.js";
import { serviceElementsSchema, validateServicePlan } from "../mcp/lib/serviceElements.js";
import { mapToolError } from "../mcp/lib/toolErrors.js";
import { transposeChordProSource } from "../mcp/lib/transposeSource.js";
import {
  nativeWebAuthFromRuntime,
  nativeWebFetch,
  type NativeWebAuth,
  NATIVE_WEB_CAPABILITIES,
  providerSupportsNativeFetch,
} from "../mcp/lib/nativeWeb.js";
import {
  getMe,
  getMember,
  getOrganization,
  listMembers,
  resolveMembers,
} from "../mcp/lib/orgDirectory.js";
import {
  STUDIO_NAVIGATE_KINDS,
  STUDIO_PRINT_KINDS,
  studioNavigateDirective,
  studioPrintDirective,
} from "../mcp/lib/studioActions.js";
import { OPEN_APP_TARGETS, openAppDirective } from "../mcp/lib/openApp.js";
import { FOLDER_COLOR_IDS, FOLDER_ICON_IDS, STUDIO_UI_CATALOG } from "../mcp/lib/studioUi.js";
import { searchWeb } from "../mcp/lib/webSearch.js";
import { searchYouTube } from "../mcp/lib/youtubeSearch.js";
import { clockContextPromptBlock } from "../lib/clockContext.js";
import { createSharedEmbeddedTools } from "../mcp/domains/toolFactory.js";
import { AppError } from "../utils/errors.js";

const folderIconSchema = z.enum(FOLDER_ICON_IDS);
const folderColorSchema = z.enum(FOLDER_COLOR_IDS);
import type { AiProvider } from "./orgAiConfig.service.js";
import { AI_PROVIDER_DEFAULT_BASE_URL, OrgAiConfigService } from "./orgAiConfig.service.js";
import { SongImportService } from "./songImport.service.js";

export type ChatPageContext = {
  kind?:
    | "song_editor"
    | "service_editor"
    | "songs_list"
    | "services_list"
    | "explorer"
    | "collection_detail"
    | "agenda"
    | "trash"
    | "general";
  route?: string;
  songId?: string;
  serviceId?: string;
  folderId?: string | null;
  collectionId?: string | null;
  title?: string;
  updatedAt?: string;
  artist?: string;
  contentExcerpt?: string;
  contentTruncated?: boolean;
  selectedSongIds?: string[];
  selectedFolderIds?: string[];
  serviceElementsSummary?: Array<{
    id: string;
    type: string;
    title?: string;
    songId?: string;
  }>;
  /** Mounting app (`studio`, `auth`, future suite apps). */
  hostApp?: string;
  /** Local Logos capabilities reported by the client. */
  hostCapabilities?: string[];
};

/**
 * OpenAI-compatible hosts (DeepSeek, Groq, Together, custom gateways) speak
 * Chat Completions — use `.chat()`. Official OpenAI also works via `.chat()`.
 * Anthropic / Google keep their native AI SDK providers.
 */
function buildModel(
  provider: AiProvider,
  modelId: string,
  apiKey: string,
  baseUrl?: string | null,
) {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "deepseek":
    case "openai_compatible":
    case "openai":
    default: {
      const url = baseUrl || AI_PROVIDER_DEFAULT_BASE_URL[provider] || undefined;
      const client = createOpenAI({
        apiKey,
        ...(url ? { baseURL: url } : {}),
        name: provider,
      });
      // Chat Completions path — works with DeepSeek and most OpenAI forks.
      return client.chat(modelId);
    }
  }
}

function textResult(data: unknown) {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

const songImport = new SongImportService();

export function modelFileDataToBase64(data: unknown): string | null {
  if (typeof data === "string") {
    const idx = data.indexOf("base64,");
    return idx >= 0 ? data.slice(idx + "base64,".length) : data;
  }
  if (data instanceof Uint8Array) return Buffer.from(data).toString("base64");
  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data)).toString("base64");
  if (Buffer.isBuffer(data)) return data.toString("base64");
  if (data && typeof data === "object") {
    const obj = data as { type?: string; data?: unknown; url?: unknown };
    if (obj.type === "data" && obj.data != null) return modelFileDataToBase64(obj.data);
    if (obj.type === "url" && typeof obj.url === "string") {
      const idx = obj.url.indexOf("base64,");
      return idx >= 0 ? obj.url.slice(idx + "base64,".length) : null;
    }
  }
  return null;
}

/** Studio-only: stage a destructive action for the Confirm button (does not mutate). */
function deleteConfirmation(opts: {
  action:
    "delete_song" | "delete_service" | "delete_folder" | "delete_collection" | "delete_agenda";
  id: string;
  title: string;
  detail?: string;
  folderAction?: "move_to_root" | "delete_songs";
}) {
  return {
    confirmation: {
      ...opts,
      requiresUiConfirm: true,
      message: `Staged in Studio — the user must click Confirm to ${opts.action.replace(/_/g, " ")} "${opts.title}". Do NOT claim it is deleted until they confirm.`,
    },
  };
}

const MAX_BATCH = 25;

/**
 * Run many small mutations in one tool call (sequentially, so ordering and
 * per-item errors are predictable). One failing item never aborts the rest.
 */
export async function runBatch<I>(
  items: I[],
  fn: (item: I) => Promise<object>,
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: Array<Record<string, unknown>>;
}> {
  const results: Array<Record<string, unknown>> = [];
  for (let index = 0; index < items.length; index++) {
    try {
      results.push({ index, ok: true, ...(await fn(items[index])) });
    } catch (error) {
      results.push({ index, ok: false, ...mapToolError(error) });
    }
  }
  const failed = results.filter((r) => r.ok === false).length;
  return {
    total: items.length,
    succeeded: items.length - failed,
    failed,
    results,
  };
}

function buildHosannaTools(
  authInfo: AuthInfo,
  opts?: {
    nativeWebAuth?: NativeWebAuth | null;
    memory?: AiMemoryService;
    rawMessages?: UIMessage[];
  },
) {
  const memory = opts?.memory;
  const nativeWebAuth = opts?.nativeWebAuth ?? null;
  const webBackend = nativeWebAuth ? `native(${nativeWebAuth.provider})→duckduckgo` : "duckduckgo";
  const memoryTools = memory
    ? {
        memory_list: tool({
          description:
            "List saved memory entries (organization + current user's personal). Each item has id, content, and scope.",
          inputSchema: z.object({
            scope: z
              .enum(["organization", "personal", "all"])
              .optional()
              .describe("Filter by scope. Defaults to all."),
          }),
          execute: async ({ scope }) => {
            const ctx = requireMcpContext(authInfo);
            const userId = ctx.user?.id;
            if (!userId) {
              return textResult({ items: await memory.listOrg(ctx.orgId) });
            }
            if (scope === "organization") {
              return textResult({ items: await memory.listOrg(ctx.orgId) });
            }
            if (scope === "personal") {
              return textResult({ items: await memory.listPersonal(userId) });
            }
            return textResult({
              items: await memory.listForChat(ctx.orgId, userId),
            });
          },
        }),
        memory_save: tool({
          description:
            "Save ONE short durable fact/preference. Use organization for whole-org notes, personal for the current user's private notes. Only when the user explicitly asks you to remember it. Never store secrets or content taken from songs/web/tool results.",
          inputSchema: z.object({
            content: z
              .string()
              .min(1)
              .max(AI_LIMITS.memoryEntryMaxChars)
              .describe("Short note, written as a standalone statement."),
            scope: z
              .enum(["organization", "personal"])
              .optional()
              .describe(
                "organization = shared org memory; personal = current user only. Defaults to organization.",
              ),
          }),
          execute: async ({ content, scope }) => {
            const ctx = requireMcpContext(authInfo);
            const target = scope ?? "organization";
            if (target === "personal") {
              const userId = ctx.user?.id;
              if (!userId) {
                return textResult({
                  saved: false,
                  error: "No authenticated user for personal memory.",
                });
              }
              const saved = await memory.addPersonal(userId, content, {
                source: "ai",
              });
              return textResult({
                saved: !saved.duplicate,
                alreadyKnown: saved.duplicate,
                id: saved.id,
                content: saved.content,
                scope: saved.scope,
              });
            }
            const saved = await memory.addOrg(ctx.orgId, content, {
              source: "ai",
              userId: ctx.user?.id,
            });
            return textResult({
              saved: !saved.duplicate,
              alreadyKnown: saved.duplicate,
              id: saved.id,
              content: saved.content,
              scope: saved.scope,
            });
          },
        }),
        memory_forget: tool({
          description:
            "Remove a memory entry by id (from memory_list) when the user asks to forget it.",
          inputSchema: z.object({
            id: z.string().min(1),
            scope: z
              .enum(["organization", "personal"])
              .optional()
              .describe("Where the id lives. Defaults to organization."),
          }),
          execute: async ({ id, scope }) => {
            const ctx = requireMcpContext(authInfo);
            const target = scope ?? "organization";
            if (target === "personal") {
              const userId = ctx.user?.id;
              if (!userId) return textResult({ removed: false });
              return textResult({
                removed: await memory.removePersonal(userId, id),
              });
            }
            return textResult({
              removed: await memory.removeOrg(ctx.orgId, id),
            });
          },
        }),
      }
    : {};
  return {
    ...memoryTools,

    folders_create_many: tool({
      description: `Create up to ${MAX_BATCH} folders in ONE call (prefer this over repeated folders_create). Same color/icon rules as folders_create. Per-item results; Studio refreshes automatically.`,
      inputSchema: z.object({
        folders: z
          .array(
            z.object({
              name: z.string().min(1),
              parentId: z.string().nullable().optional(),
              color: folderColorSchema.optional(),
              icon: folderIconSchema.optional(),
            }),
          )
          .min(1)
          .max(MAX_BATCH),
      }),
      execute: async ({ folders }) => {
        const ctx = requireMcpContext(authInfo);
        return textResult(await runBatch(folders, (f) => createFolder(ctx, f)));
      },
    }),
    folders_update_many: tool({
      description: `Rename/move/recolor up to ${MAX_BATCH} folders in ONE call (prefer this over repeated folders_update when changing several folders). Each item needs folderId + updatedAt (from folders_list). Per-item results; Studio refreshes automatically.`,
      inputSchema: z.object({
        updates: z
          .array(
            z.object({
              folderId: z.string(),
              updatedAt: z.string(),
              name: z.string().min(1).optional(),
              parentId: z.string().nullable().optional(),
              color: folderColorSchema.optional(),
              icon: folderIconSchema.optional(),
            }),
          )
          .min(1)
          .max(MAX_BATCH),
      }),
      execute: async ({ updates }) => {
        const ctx = requireMcpContext(authInfo);
        return textResult(await runBatch(updates, (u) => updateFolder(ctx, u)));
      },
    }),
    collections_update_many: tool({
      description: `Update metadata (name/description/color/icon) of up to ${MAX_BATCH} collections in ONE call. Each item needs collectionId + updatedAt. Per-item results; Studio refreshes automatically.`,
      inputSchema: z.object({
        updates: z
          .array(
            z.object({
              collectionId: z.string(),
              updatedAt: z.string(),
              name: z.string().min(1).optional(),
              description: z.string().nullable().optional(),
              color: folderColorSchema.optional(),
              icon: folderIconSchema.optional(),
            }),
          )
          .min(1)
          .max(MAX_BATCH),
      }),
      execute: async ({ updates }) => {
        const ctx = requireMcpContext(authInfo);
        return textResult(await runBatch(updates, (u) => updateCollection(ctx, u)));
      },
    }),
    suggest_followups: tool({
      description:
        "Studio chat UI only: show 2-3 short clickable follow-up prompts under your final answer (same language as the user). Call at most once, as the LAST tool call of a turn, only when natural next steps exist. Never use it for questions you need answered.",
      inputSchema: z.object({
        options: z
          .array(z.string().min(2).max(80))
          .min(1)
          .max(4)
          .describe("Short imperative prompts the user can click to send."),
      }),
      execute: async ({ options }) => textResult({ shown: options.length }),
    }),
    studio_sync: tool({
      description:
        "Studio-only: ask the open Studio tab to pull replication now so explorer/lists show server changes immediately. Call after folders/collections/songs/services mutations. Not needed on MCP hosts.",
      inputSchema: z.object({
        reason: z.string().optional().describe("Short why, e.g. after_folder_update"),
      }),
      execute: async ({ reason }) =>
        textResult({
          studioSync: true,
          reason: reason ?? "refresh",
          note: "Studio will run triggerSyncCheck + refetch. Tell the user the UI should update shortly.",
        }),
    }),
    studio_navigate: tool({
      description:
        "Open a library page (song/service/folder/collection/agenda/list/settings). Prefer kind+id over inventing routes. On Studio this navigates in-tab; on auth and other Hosanna apps the client opens Music/Studio via open_app automatically — you can still call studio_navigate.",
      inputSchema: z.object({
        kind: z.enum(STUDIO_NAVIGATE_KINDS),
        id: z
          .string()
          .optional()
          .describe("Entity id when kind is song/service/folder/collection/agenda"),
        route: z
          .string()
          .optional()
          .describe("Optional absolute path under the org slug when kind=route"),
        reason: z.string().optional(),
      }),
      execute: async (args) =>
        textResult(
          studioNavigateDirective({
            kind: args.kind,
            id: args.id,
            route: args.route,
            reason: args.reason,
          }),
        ),
    }),
    open_app: tool({
      description:
        'Open a Hosanna web app by subdomain id (modular for new apps). app="saas" → hosanna.live; app="studio"|"music" → studio.hosanna.live (Music); app="auth" → auth.hosanna.live; any future slug follows {app}.hosanna.live. Pass path (e.g. /account/organization/ai or /{orgSlug}/songs) and openIn same|new.',
      inputSchema: z.object({
        app: z
          .string()
          .min(1)
          .max(64)
          .describe(
            'App id: "saas" for the marketing site, or a subdomain slug (studio, auth, …).',
          ),
        path: z.string().optional().describe("Path including leading slash. Defaults to /."),
        openIn: z
          .enum(OPEN_APP_TARGETS)
          .optional()
          .describe("same = current tab; new = new tab/window. Defaults to same."),
        reason: z.string().optional(),
      }),
      execute: async (args) =>
        textResult(
          openAppDirective({
            app: args.app,
            path: args.path,
            openIn: args.openIn,
            reason: args.reason,
          }),
        ),
    }),
    studio_generate_pdf: tool({
      description:
        "Open the print/PDF flow for song(s), service(s), folder, collection, or agenda event. On Studio this opens the print modal; on other apps the client opens the entity in Music so the user can print there.",
      inputSchema: z.object({
        kind: z.enum(STUDIO_PRINT_KINDS),
        ids: z.array(z.string().min(1)).min(1).describe("One or more entity ids to print"),
        title: z.string().optional(),
        options: z
          .object({
            showChords: z.boolean().optional(),
            twoColumnLayout: z.boolean().optional(),
            fontSize: z.number().optional(),
            showChurchHeader: z.boolean().optional(),
            showMetadata: z.boolean().optional(),
            includeServiceSongs: z.boolean().optional(),
            includeFolderSongs: z.boolean().optional(),
            includeCollectionSongs: z.boolean().optional(),
            pageBreakBetweenItems: z.boolean().optional(),
          })
          .optional(),
        reason: z.string().optional(),
      }),
      execute: async (args) =>
        textResult(
          studioPrintDirective({
            kind: args.kind,
            ids: args.ids,
            title: args.title,
            options: args.options,
            reason: args.reason,
          }),
        ),
    }),
    studio_search: tool({
      description:
        'Studio-oriented global search across songs, services (incl. archived when asked), folders, collections, and agenda. Prefer this when the user says "find X in Studio".',
      inputSchema: z.object({
        query: z.string().min(1),
        types: z
          .array(z.enum(["song", "service", "folder", "collection", "agenda"]))
          .optional()
          .describe("Defaults to all types"),
        includeArchivedServices: z.boolean().optional().default(true),
        limitPerType: z.number().int().positive().max(20).optional().default(8),
      }),
      execute: async (args) => {
        const ctx = requireMcpContext(authInfo);
        const q = args.query.trim().toLowerCase();
        const types = new Set(
          args.types?.length
            ? args.types
            : (["song", "service", "folder", "collection", "agenda"] as const),
        );
        const limit = args.limitPerType ?? 8;
        const hits: Array<{
          type: string;
          id: string;
          title: string;
          subtitle?: string;
          archived?: boolean;
        }> = [];

        if (types.has("song")) {
          requirePermission(ctx, "song.access");
          const songs = await songService(ctx).list({
            search: args.query,
            page: 1,
            limit,
            sortBy: "title",
            sortOrder: "asc",
          });
          for (const s of songs.songs) {
            hits.push({
              type: "song",
              id: s.id,
              title: s.title,
              subtitle: s.artist || undefined,
            });
          }
        }

        if (types.has("service")) {
          requirePermission(ctx, "service.access");
          let services = await serviceService(ctx).list({
            includeArchived: args.includeArchivedServices ?? true,
          });
          services = services.filter(
            (s) => s.name.toLowerCase().includes(q) || (s.notes ?? "").toLowerCase().includes(q),
          );
          for (const s of services.slice(0, limit)) {
            hits.push({
              type: "service",
              id: s.id,
              title: s.name,
              subtitle: s.date ? String(s.date).slice(0, 10) : undefined,
              archived: s.archived,
            });
          }
        }

        if (types.has("folder")) {
          requirePermission(ctx, "folder.access");
          const { folders } = await listFolders(ctx);
          for (const f of folders.filter((f) => f.name.toLowerCase().includes(q)).slice(0, limit)) {
            hits.push({ type: "folder", id: f.id, title: f.name });
          }
        }

        if (types.has("collection")) {
          requirePermission(ctx, "collection.access");
          const { collections } = await listCollections(ctx);
          for (const c of collections
            .filter(
              (c) =>
                c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
            )
            .slice(0, limit)) {
            hits.push({
              type: "collection",
              id: c.id,
              title: c.name,
              subtitle: c.description || undefined,
            });
          }
        }

        if (types.has("agenda")) {
          requirePermission(ctx, "agenda.access");
          const { events } = await listAgenda(ctx, { limit: 100 });
          for (const e of events
            .filter(
              (e) =>
                e.title.toLowerCase().includes(q) ||
                e.type.toLowerCase().includes(q) ||
                (e.notes ?? "").toLowerCase().includes(q) ||
                e.location?.toLowerCase().includes(q),
            )
            .slice(0, limit)) {
            hits.push({
              type: "agenda",
              id: e.id,
              title: e.title,
              subtitle: `${e.date} ${e.time} · ${e.type}`,
            });
          }
        }

        return textResult({
          query: args.query,
          total: hits.length,
          hits,
          tip: "Use studio_navigate({ kind, id }) to open a hit, or studio_generate_pdf({ kind, ids }) to print.",
        });
      },
    }),

    ...(nativeWebAuth && providerSupportsNativeFetch(nativeWebAuth.provider) ? {} : {}),

    songs_import_sheet: tool({
      description:
        "Run the AI song-import pipeline on a sheet-music image (or the page images of a PDF) the user attached in chat. Creates an import job and returns its id — the chat UI polls it and shows live step progress. Only call when the user asks to import a chord sheet and an image/PDF is attached.",
      inputSchema: z.object({
        fileIndex: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe(
            "Which attached image to use when several are attached; defaults to the first.",
          ),
      }),
      execute: async (args, { messages }) => {
        const ctx = requireMcpContext(authInfo);
        requirePermission(ctx, "song.import");

        let rawParts: unknown[] = [];
        if (opts?.rawMessages) {
          for (let i = opts.rawMessages.length - 1; i >= 0; i--) {
            const m = opts.rawMessages[i];
            if (m?.role === "user" && Array.isArray(m.parts)) {
              rawParts = m.parts;
              break;
            }
          }
        }
        if (rawParts.length === 0) {
          for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m?.role === "user" && Array.isArray(m.content)) {
              rawParts = m.content;
              break;
            }
          }
        }

        const fileParts = rawParts.filter((p): p is Record<string, unknown> =>
          Boolean(p && typeof p === "object" && (p as { type?: string }).type === "file"),
        );

        const images = fileParts.filter((p) => {
          const media = String(p.mediaType || "");
          return media.startsWith("image/");
        });

        if (images.length === 0) {
          const pdfPart = fileParts.find((p) => String(p.mediaType || "") === "application/pdf");
          if (pdfPart) {
            return textResult({
              error: true,
              code: "pdf_requires_rendering",
              message:
                "PDF sheet music needs to be rendered to images before import. Please use the Sheet Music Importer modal in Studio.",
            });
          }
          return textResult({
            error: true,
            code: "no_sheet",
            message: "No sheet music image or PDF found in the message.",
          });
        }

        const primary = images[args.fileIndex ?? 0] ?? images[0];
        const primaryB64 = modelFileDataToBase64(primary.url ?? primary.data);
        if (!primaryB64) {
          return textResult({
            error: true,
            code: "unreadable_file",
            message: "Could not read the attached image.",
          });
        }

        const mimeOf = (p: Record<string, unknown>) => String(p.mediaType || "image/jpeg");
        const rest = args.fileIndex == null ? images.slice(1) : [];
        const restImages = rest
          .map((p) => ({
            base64: modelFileDataToBase64(p.url ?? p.data),
            mime: mimeOf(p),
          }))
          .filter((x): x is { base64: string; mime: string } => Boolean(x.base64));

        const fileName = typeof primary.filename === "string" ? primary.filename : undefined;
        const job = await songImport.createJob({
          orgId: ctx.orgId,
          sourceType: restImages.length > 0 ? "gallery" : "photo",
          imageBase64: primaryB64,
          imageMimeType: mimeOf(primary),
          imagesBase64: restImages.map((x) => x.base64),
          imageMimeTypes: restImages.map((x) => x.mime),
          fileName,
        });
        return textResult({ importJobId: job.id, status: job.status, steps: job.steps });
      },
    }),
  };
}

function embeddedToolAllowedForApp(name: string, appId: string | undefined): boolean {
  if (
    name === "open_app" ||
    name === "suggest_followups" ||
    name === "studio_sync" ||
    name.startsWith("memory_")
  ) {
    return true;
  }
  const musicAndPlanningTools = new Set([
    "studio_navigate",
    "studio_generate_pdf",
    "studio_search",
  ]);
  if (musicAndPlanningTools.has(name)) return appId === "music" || appId === "planning";
  if (name === "songs_import_sheet" || name.startsWith("folders_") || name.startsWith("collections_")) {
    return appId === "music";
  }
  return false;
}

/**
 * Logos chat system — shared across Studio, Auth, and future suite apps.
 * Host-specific UX is driven by pageContext.hostApp / hostCapabilities.
 */
const LOGOS_CHAT_SYSTEM = `You are Logos, the friendly AI assistant inside Hosanna, for church song libraries and service planning. Stay warm, concise and practical.

## Style (strict)
- Be brief. Prefer doing over asking. One short sentence + tools beats essays.
- Do NOT paste full ChordPro bodies into chat. Call propose/edit tools; the host UI shows Accept/Decline (or opens Music when the current app has no editor).
- When the user attaches an image or PDF of a chord sheet and asks to import it, call \`songs_import_sheet\` once — the chat UI polls the job and shows a Save Song card. Never retype lyrics/chords the model cannot see.
- Prefer pageContext ids + updatedAt. Do NOT call list/search just to discover the open song/service/folder.
- Skills/docs are NOT in your context until you read them: hosanna_skills_list → hosanna_skill_read, or hosanna_resource_read. Never invent skill contents — quote what the tool returns.
- For clear requests (transpose to D, repeat a section 2×, duplicate last verse, fix chords, complete metadata, create folder/event), act immediately with a sensible default. Ask at most ONE question only when blocked.
- Do not offer multiple options when the user already chose (e.g. "transpose into D").
- ChordPro/song content edits: use propose tools (prefer songs_propose_transpose / songs_propose_edit). The UI stages Accept/Decline. After Accept, the user may still save in an editor — only call songs_save / services_save if they explicitly ask to persist via chat/MCP.
- Library structural edits (folders, collections, agenda create/update, move song, add songs to collection): do them with tools when the request is clear. Studio refreshes the explorer automatically after mutations — do NOT call \`studio_sync\` unless the user asks to refresh.
- Changing several folders/collections at once: use \`folders_update_many\` / \`folders_create_many\` / \`collections_update_many\` in ONE call instead of many single calls. Items fail independently — report any failed index honestly.
- At the end of a turn, when natural next steps exist, you MAY call \`suggest_followups\` once (last tool call) with 2-3 short clickable prompts. Never use it for questions you need answered; do not repeat them in the text.
- Folder/collection \`icon\` and \`color\` must be Studio/Music ids only (see hosanna_capabilities.studioUi or hosanna://domain/library). Never invent Lucide names. Use \`icon=default\` / \`color=default\` to reset.
- Deletes (songs/services/folders/collections/agenda): call the matching \`*_delete\` tool immediately when the user asks to delete — it only STAGES a Confirm button in the chat UI and does not delete. Do NOT ask for chat confirmation ("are you sure?") and do NOT claim the item is deleted until the user clicks Confirm. If they already confirmed in chat, still only stage the button.
- When the user says "repeat" / "2x" a verse or chorus: duplicate that section's body in the ChordPro (or add \`{c: 2x}\` if they ask for a note only). Prefer physical duplication when they ask to "write a copy".
- On stale/concurrency errors, use the returned \`current\` object (do not re-fetch blindly).
- \`{chorus}\` (alias \`{ch}\`, optional label \`{chorus: Refrão final}\`) recalls the previous \`start_of_chorus\` block without copying it. When a chorus repeats UNCHANGED, write \`{chorus}\` instead of duplicating the lines (unless the user asks for a physical copy or the repeat has different chords/words). Never put \`{chorus}\` before any chorus exists.
- \`{key_note: text}\` is a free-text note about key changes (e.g. \`{key_note: Verso 4 e final modulam para D (meio tom acima)}\`); the renderer shows it under the song header. Use it for modulations — not \`{c:}\`, not \`{key:}\` (which is the main key).
- \`{tags: label1, label2}\` stores comma-separated editor-only labels (not rendered). Do not add tags the user did not ask for.
- Propagating/completing chords: \`songs_draft_propagate_chords\` / \`chordpro_propagate_chords\` return a DRAFT that is NOT staged. Read \`review\` and \`skipped\`: re-place every chord marked \`check\` on the right word/syllable yourself (use the source line as reference), fill \`skipped\` lines when the chords are obvious, make sure no chord lands mid-word by accident, then call \`songs_propose_edit\` ONCE with the corrected full content. Never propose the raw draft unchecked and never invent chords the song does not already use.

## Host awareness
- pageContext.hostApp / hostCapabilities tell you which app mounted Logos (studio, auth, …).
- Chat is the universal approval surface. On thin hosts (auth, apps without editor.songs / navigate.local): use propose tools and delete confirms — the user Accepts/Declines in chat via API. Do NOT refuse song/service edits just because the user is in Auth.
- Do NOT call studio_navigate or studio_generate_pdf after a propose just to "show" the edit — the proposal card is enough. Only navigate/print when the user explicitly asks to open or print something.
- On thin hosts, navigate/print tools become an optional "Open in Music" chat card (no auto tab switch). Use open_app only when the user clearly wants to leave for another product (account settings, marketing, a future app).

## Capabilities (use them)
- Songs: search, search_lyrics (plain lyrics ignoring chords), get/get_many, draft, propose_edit/fix/transpose, save, move, delete, restore, import_sheet (run AI sheet-music import on an attached image/PDF); trash_list
- Services: search/get (expandSongs), propose_edit, plan_suggest, validate, save, delete, restore
- People/org: me, members_list, members_get, members_resolve, org_get. Resolve people before agenda assignees.
- Record status: draft = not persisted; saved/verified = in DB. Never call a draft "saved".
- Folders: list/create/update/delete/restore (icon/color ids from studioUi)
- Collections: list/get/create/update/delete, add_songs/remove_songs (same icon/color ids)
- Agenda: list/get/create/update/delete — set responsibilities with real memberIds (not only notes on service elements)
- Services: services_search supports archived / includeArchived (rows include archived flag)
- Host UX: studio_navigate, studio_generate_pdf, studio_search, suggest_followups — work across apps via client routing
- Cross-app: open_app({ app, path?, openIn? }) — app="saas" → hosanna.live; app="studio"|"music"|"auth"|future slug → {app}.hosanna.live (music currently maps to Studio)
- Metadata: MusicBrainz, YouTube (for \`{youtube:}\`), DuckDuckGo web search; ChordPro validate/format/transpose/convert/propagate
- When completing metadata: MusicBrainz for title/artist/release; YouTube search for \`{youtube: URL}\` (use hits[].directive); web search for extra confirmation. If \`metadata_web_fetch\` is available (DeepSeek org AI), use it to read CCLI/artist pages or Cifra URLs blocked by Akamai. Call metadata tools one at a time (MusicBrainz rate-limits parallel bursts with 503). If a tool returns 403/503, report the structured error — do not claim success. Propose the ChordPro edit — do not invent lyrics.
- Unknown Studio/Music UI constants (icons, colors, etc.): call hosanna_capabilities or hosanna_resource_read on hosanna://domain/library — do not guess.

## Hard rules
- Never invent lyrics, chords, or library songs. Ask when content is missing.
- Never silently delete or rewrite unrelated content.
- Respect permissions and \`updatedAt\` concurrency on updates/saves.
- Service element \`duration\` is **seconds** (not minutes). Prefer real \`memberId\`s on agenda assignees.
`;

function contextBlock(page?: ChatPageContext): string {
  if (!page) return "";
  const excerpt = page.contentExcerpt ? page.contentExcerpt.slice(0, 12_000) : "";
  const hostApp = page.hostApp?.trim() || "unknown";
  return `

## Current page context (host: ${hostApp})
Prefer these ids/updatedAt over discovery tools. Honor hostCapabilities when choosing UX tools.
${JSON.stringify(
  {
    hostApp,
    hostCapabilities: page.hostCapabilities ?? [],
    kind: page.kind ?? "general",
    route: page.route,
    songId: page.songId,
    serviceId: page.serviceId,
    folderId: page.folderId,
    collectionId: page.collectionId,
    title: page.title,
    artist: page.artist,
    updatedAt: page.updatedAt,
    contentTruncated: page.contentTruncated,
    selectedSongIds: page.selectedSongIds,
    selectedFolderIds: page.selectedFolderIds,
    serviceElementsSummary: page.serviceElementsSummary,
  },
  null,
  2,
)}
${excerpt ? `\n### Content excerpt${page.contentTruncated ? " (truncated)" : ""}\n\`\`\`chordpro\n${excerpt}\n\`\`\`` : ""}
`;
}

/**
 * Hard safety net on model↔tool round trips. The real limit is the org's
 * `maxToolCalls` (see `toolBudgetNotice`); this only guards against runaway
 * loops, e.g. models that ignore the disabled tools.
 */
export function chatStepSafetyLimit(maxToolCalls: number): number {
  return maxToolCalls + 3;
}

const LOCALE_NAMES: Record<string, string> = {
  pt: "European Portuguese (pt-PT)",
  en: "English",
  es: "Spanish",
};

export function localePromptBlock(locale?: string): string {
  const name = locale ? LOCALE_NAMES[locale] : undefined;
  if (!name) return "";
  return `

## Language
The user's UI language is ${name}. Reply in that language unless the user writes in another one. Keep ChordPro directives, ids and tool arguments in their canonical form.
`;
}

/**
 * Safe, user-facing message for a stream error. Provider internals (URLs,
 * request bodies, keys) are never forwarded.
 */
export function describeChatError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (APICallError.isInstance(error)) {
    const status = error.statusCode;
    if (status === 401 || status === 403) {
      return "The AI provider rejected the API key. Check the AI settings for this organization.";
    }
    if (status === 404) {
      return "The configured AI model was not found. Check the model name in AI settings.";
    }
    if (status === 429) {
      return "The AI provider is rate-limiting requests. Wait a moment and try again.";
    }
    if (status && status >= 500) {
      return "The AI provider is temporarily unavailable. Please try again.";
    }
    return "The AI provider could not process this request.";
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (/UnsupportedFunctionalityError|file part|media type|data URL/i.test(msg)) {
    return "The configured AI provider does not support this file attachment type. Try attaching as an image or use the Sheet Music Importer.";
  }
  return "Something went wrong while generating the reply. Please try again.";
}

export function filterUnsupportedFileParts(
  messages: UIMessage[],
  provider: AiProvider,
): UIMessage[] {
  const supportsPdf = provider === "google" || provider === "anthropic";
  const supportsImage = provider === "google" || provider === "anthropic" || provider === "openai";

  return messages.map((m) => {
    if (m.role !== "user" || !Array.isArray(m.parts)) return m;
    const parts = m.parts.map((p) => {
      if (p.type !== "file") return p;
      const filePart = p as { type: "file"; mediaType?: string; url?: string; filename?: string };
      const mediaType = filePart.mediaType || "application/octet-stream";
      const isPdf = mediaType === "application/pdf";
      const isImage = mediaType.startsWith("image/");

      if (isPdf && !supportsPdf) {
        return {
          type: "text" as const,
          text: `[Attached PDF: ${filePart.filename || "document.pdf"}. The document is attached and available for tools.]`,
        };
      }

      if (isImage && !supportsImage) {
        return {
          type: "text" as const,
          text: `[Attached image: ${filePart.filename || "sheet.jpg"}. The image is attached and available for tools.]`,
        };
      }

      if (!isPdf && !isImage) {
        return {
          type: "text" as const,
          text: `[Attached file: ${filePart.filename || "attachment"} (${mediaType}).]`,
        };
      }

      return p;
    });

    return { ...m, parts };
  });
}

export class AiChatService {
  private config = new OrgAiConfigService();
  private memory = new AiMemoryService();

  async streamChat(opts: {
    orgId: string;
    authInfo: AuthInfo;
    messages: UIMessage[];
    pageContext?: ChatPageContext;
    appId?: import("@hosanna/auth").SuiteAppId;
    locale?: string;
    abortSignal?: AbortSignal;
  }) {
    const runtime = await this.config.getRuntimeConfig(opts.orgId);
    const model = buildModel(runtime.provider, runtime.model, runtime.apiKey, runtime.baseUrl);
    const nativeWebAuth = nativeWebAuthFromRuntime(runtime);
    const chatUserId = getMcpContext(opts.authInfo)?.user?.id;
    const memoryEntries = runtime.memoryEnabled
      ? chatUserId
        ? await this.memory.listForChat(opts.orgId, chatUserId)
        : await this.memory.listOrg(opts.orgId)
      : [];
    const toolCtx = {
      nativeWebAuth,
      memory: runtime.memoryEnabled ? this.memory : undefined,
      rawMessages: opts.messages,
    };
    const baseTools = buildHosannaTools(opts.authInfo, toolCtx);
    const sharedTools = createSharedEmbeddedTools(opts.authInfo, { ...toolCtx, appId: opts.appId });
    const embeddedOnlyTools = Object.fromEntries(
      Object.entries(baseTools).filter(
        ([name]) => !(name in sharedTools) && embeddedToolAllowedForApp(name, opts.appId),
      ),
    );
    const tools = {
      ...embeddedOnlyTools,
      ...sharedTools,
    };
    const system =
      LOGOS_CHAT_SYSTEM +
      (runtime.memoryEnabled ? MEMORY_USAGE_PROMPT : "") +
      customInstructionsPromptBlock(runtime.instructions) +
      memoryPromptBlock(memoryEntries) +
      localePromptBlock(opts.locale) +
      clockContextPromptBlock() +
      contextBlock(opts.pageContext);
    const messages = filterUnsupportedFileParts(opts.messages, runtime.provider);
    const modelMessages = await convertToModelMessages(messages);

    const budget: ToolBudgetState = {
      max: runtime.maxToolCalls,
      used: 0,
      limitReached: false,
    };

    return {
      model: { provider: runtime.provider, id: runtime.model },
      budget,
      result: streamText({
        model,
        system,
        messages: modelMessages as ModelMessage[],
        tools: tools as ToolSet,
        ...(runtime.temperature != null && {
          temperature: runtime.temperature,
        }),
        ...(runtime.maxOutputTokens != null && {
          maxOutputTokens: runtime.maxOutputTokens,
        }),
        stopWhen: stepCountIs(chatStepSafetyLimit(budget.max)),
        prepareStep: ({ steps, initialInstructions }) => {
          budget.used = steps.reduce((n, s) => n + s.toolCalls.length, 0);
          const notice = toolBudgetNotice(budget.used, budget.max);
          if (!notice) return undefined;
          const base = typeof initialInstructions === "string" ? initialInstructions : system;
          if (!notice.final) return { instructions: base + notice.text };
          budget.limitReached = true;
          return {
            instructions: base + notice.text,
            toolChoice: "none",
            activeTools: [],
          };
        },
        abortSignal: opts.abortSignal,
      }),
    };
  }
}
