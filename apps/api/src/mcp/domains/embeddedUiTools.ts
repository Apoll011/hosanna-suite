// SPDX-License-Identifier: AGPL-3.0-only
import type { AuthInfo } from "@modelcontextprotocol/server";
import type { LogosToolDefinition, LogosToolFactory, SuiteAppId } from "@hosanna/logos-ai/tools";
import { z } from "zod";
import {
  getMcpContext,
  requirePermission,
  services as serviceService,
  songs as songService,
} from "../context.js";
import { listAgenda, listCollections, listFolders } from "../lib/libraryCrud.js";
import {
  STUDIO_NAVIGATE_KINDS,
  STUDIO_PRINT_KINDS,
  studioNavigateDirective,
  studioPrintDirective,
} from "../lib/studioActions.js";
import { OPEN_APP_TARGETS, openAppDirective } from "../lib/openApp.js";

const MUSIC_PLANNING: readonly SuiteAppId[] = ["music", "planning"];

type ParsedTool<Schema extends z.ZodTypeAny> = Omit<
  LogosToolDefinition,
  "execute" | "inputSchema" | "ui"
> & {
  inputSchema: Schema;
  execute: (input: z.infer<Schema>) => unknown | Promise<unknown>;
};

function parsedDefinition<Schema extends z.ZodTypeAny>(
  definition: ParsedTool<Schema>,
): LogosToolDefinition {
  return {
    ...definition,
    execute: (input) => definition.execute(definition.inputSchema.parse(input)),
  };
}

function uiDefinition<Schema extends z.ZodTypeAny>(
  definition: ParsedTool<Schema> & { apps: readonly SuiteAppId[] | "suite" },
): LogosToolDefinition {
  return { ...parsedDefinition(definition), ui: true };
}

export const embeddedUiToolFactory: LogosToolFactory = (context) => {
  return [
    parsedDefinition({
      name: "suggest_followups",
      description:
        "Show short clickable follow-up prompts under the final answer when a natural next step exists.",
      inputSchema: z.object({
        options: z.array(z.string().min(2).max(80)).min(1).max(4),
      }),
      apps: "suite",
      surfaces: ["embedded"],
      execute: (input) => ({ shown: input.options.length }),
    }),
    uiDefinition({
      name: "studio_sync",
      description:
        "Ask the open Studio tab to pull replication now so lists show server changes immediately.",
      inputSchema: z.object({ reason: z.string().optional() }),
      apps: "suite",
      requiresCapabilities: ["library.sync"],
      execute: ({ reason }) => ({
        studioSync: true,
        reason: reason ?? "refresh",
        note: "Studio will run triggerSyncCheck + refetch. Tell the user the UI should update shortly.",
      }),
    }),
    uiDefinition({
      name: "studio_navigate",
      description: "Open a library page in the active host app using a known entity kind and id.",
      inputSchema: z.object({
        kind: z.enum(STUDIO_NAVIGATE_KINDS),
        id: z.string().optional(),
        route: z.string().optional(),
        reason: z.string().optional(),
      }),
      apps: MUSIC_PLANNING,
      requiresCapabilities: ["navigate.local"],
      execute: (input) => studioNavigateDirective(input),
    }),
    uiDefinition({
      name: "open_app",
      description:
        "Open a Hosanna web app by subdomain id, with an optional path and same-tab or new-tab behavior.",
      inputSchema: z.object({
        app: z.string().min(1).max(64),
        path: z.string().optional(),
        openIn: z.enum(OPEN_APP_TARGETS).optional(),
        reason: z.string().optional(),
      }),
      apps: "suite",
      execute: (input) => openAppDirective(input),
    }),
    uiDefinition({
      name: "studio_generate_pdf",
      description:
        "Open the print flow for songs, services, folders, collections, or agenda events.",
      inputSchema: z.object({
        kind: z.enum(STUDIO_PRINT_KINDS),
        ids: z.array(z.string().min(1)).min(1),
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
      apps: MUSIC_PLANNING,
      requiresCapabilities: ["print"],
      execute: (input) => studioPrintDirective(input),
    }),
    uiDefinition({
      name: "studio_search",
      description:
        "Search songs, services, folders, collections, and agenda entries in the active music or planning library.",
      inputSchema: z.object({
        query: z.string().min(1),
        types: z.array(z.enum(["song", "service", "folder", "collection", "agenda"])).optional(),
        includeArchivedServices: z.boolean().optional().default(true),
        limitPerType: z.number().int().positive().max(20).optional().default(8),
      }),
      apps: MUSIC_PLANNING,
      requiresCapabilities: ["catalog.songs"],
      execute: async (input) => {
        const authInfo = context.authInfo as AuthInfo | undefined;
        const auth = getMcpContext(authInfo);
        if (!auth) throw new Error("Authentication required");
        const query = input.query.trim().toLowerCase();
        const selected = new Set(
          input.types?.length ? input.types : ["song", "service", "folder", "collection", "agenda"],
        );
        const limit = input.limitPerType ?? 8;
        const hits: Array<{
          type: string;
          id: string;
          title: string;
          subtitle?: string;
          archived?: boolean;
        }> = [];
        if (selected.has("song")) {
          requirePermission(auth, "song.access");
          const result = await songService(auth).list({
            search: input.query,
            page: 1,
            limit,
            sortBy: "title",
            sortOrder: "asc",
          });
          for (const song of result.songs)
            hits.push({
              type: "song",
              id: song.id,
              title: song.title,
              subtitle: song.artist || undefined,
            });
        }
        if (selected.has("service")) {
          requirePermission(auth, "service.access");
          const services = (
            await serviceService(auth).list({
              includeArchived: input.includeArchivedServices ?? true,
            })
          ).filter(
            (service) =>
              service.name.toLowerCase().includes(query) ||
              (service.notes ?? "").toLowerCase().includes(query),
          );
          for (const service of services.slice(0, limit))
            hits.push({
              type: "service",
              id: service.id,
              title: service.name,
              subtitle: service.date ? String(service.date).slice(0, 10) : undefined,
              archived: service.archived,
            });
        }
        if (selected.has("folder")) {
          requirePermission(auth, "folder.access");
          const { folders } = await listFolders(auth);
          for (const folder of folders
            .filter((item) => item.name.toLowerCase().includes(query))
            .slice(0, limit)) {
            hits.push({ type: "folder", id: folder.id, title: folder.name });
          }
        }
        if (selected.has("collection")) {
          requirePermission(auth, "collection.access");
          const { collections } = await listCollections(auth);
          for (const collection of collections
            .filter(
              (item) =>
                item.name.toLowerCase().includes(query) ||
                (item.description ?? "").toLowerCase().includes(query),
            )
            .slice(0, limit)) {
            hits.push({
              type: "collection",
              id: collection.id,
              title: collection.name,
              subtitle: collection.description || undefined,
            });
          }
        }
        if (selected.has("agenda")) {
          requirePermission(auth, "agenda.access");
          const { events } = await listAgenda(auth, { limit: 100 });
          for (const event of events
            .filter(
              (item) =>
                item.title.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query) ||
                (item.notes ?? "").toLowerCase().includes(query) ||
                item.location?.toLowerCase().includes(query),
            )
            .slice(0, limit)) {
            hits.push({
              type: "agenda",
              id: event.id,
              title: event.title,
              subtitle: `${event.date} ${event.time} · ${event.type}`,
            });
          }
        }
        return {
          query: input.query,
          total: hits.length,
          hits,
          tip: "Use studio_navigate({ kind, id }) to open a hit, or studio_generate_pdf({ kind, ids }) to print.",
        };
      },
    }),
  ];
};
