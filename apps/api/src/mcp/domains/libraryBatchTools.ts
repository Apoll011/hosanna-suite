import type { AuthInfo } from "@modelcontextprotocol/server";
import type { LogosToolDefinition, LogosToolFactory } from "@hosanna/logos-ai/tools";
import { z } from "zod";
import { requireMcpContext } from "../context.js";
import {
  collectionAddSongs,
  collectionRemoveSongs,
  createFolder,
  updateCollection,
  updateFolder,
} from "../lib/libraryCrud.js";
import { MAX_BATCH, runBatch } from "../lib/runBatch.js";
import { FOLDER_COLOR_IDS, FOLDER_ICON_IDS } from "../lib/studioUi.js";

const folderColorSchema = z.enum(FOLDER_COLOR_IDS);
const folderIconSchema = z.enum(FOLDER_ICON_IDS);
const createFoldersSchema = z.object({
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
});
const updateFoldersSchema = z.object({
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
});
const updateCollectionsSchema = z.object({
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
});
const collectionSongsSchema = z.object({
  updates: z
    .array(
      z.object({
        collectionId: z.string().uuid(),
        songIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .min(1)
    .max(MAX_BATCH),
});

function batchDefinition<Schema extends z.ZodTypeAny>(
  options: {
    name: string;
    description: string;
    inputSchema: Schema;
    permission: string;
    execute: (input: z.infer<Schema>, authInfo?: AuthInfo) => unknown | Promise<unknown>;
  },
  authInfo?: AuthInfo,
): LogosToolDefinition {
  return {
    name: options.name,
    description: options.description,
    inputSchema: options.inputSchema,
    apps: ["music"],
    permission: options.permission,
    requiresEntitlement: true,
    execute: (input) => options.execute(options.inputSchema.parse(input), authInfo),
  };
}

export const libraryBatchToolFactory: LogosToolFactory = (context) => {
  const authInfo = context.authInfo as AuthInfo | undefined;
  return [
    batchDefinition(
      {
        name: "folders_create_many",
        description: `Create up to ${MAX_BATCH} folders in one call. Each item returns its own result.`,
        inputSchema: createFoldersSchema,
        permission: "folder.create",
        execute: async ({ folders }, authInfo) => {
          const context = requireMcpContext(authInfo);
          return runBatch(folders, (folder) => createFolder(context, folder));
        },
      },
      authInfo,
    ),
    batchDefinition(
      {
        name: "folders_update_many",
        description: `Rename, move, or recolor up to ${MAX_BATCH} folders in one call. Each item requires folderId and updatedAt.`,
        inputSchema: updateFoldersSchema,
        permission: "folder.update",
        execute: async ({ updates }, authInfo) => {
          const context = requireMcpContext(authInfo);
          return runBatch(updates, (update) => updateFolder(context, update));
        },
      },
      authInfo,
    ),
    batchDefinition(
      {
        name: "collections_update_many",
        description: `Update metadata on up to ${MAX_BATCH} collections in one call. Each item requires collectionId and updatedAt.`,
        inputSchema: updateCollectionsSchema,
        permission: "collection.update",
        execute: async ({ updates }, authInfo) => {
          const context = requireMcpContext(authInfo);
          return runBatch(updates, (update) => updateCollection(context, update));
        },
      },
      authInfo,
    ),
    batchDefinition(
      {
        name: "collections_add_songs_many",
        description: `Add songs to up to ${MAX_BATCH} collections in one call.`,
        inputSchema: collectionSongsSchema,
        permission: "collection.update",
        execute: async ({ updates }, authInfo) => {
          const context = requireMcpContext(authInfo);
          return runBatch(updates, (update) => collectionAddSongs(context, update));
        },
      },
      authInfo,
    ),
    batchDefinition(
      {
        name: "collections_remove_songs_many",
        description: `Remove songs from up to ${MAX_BATCH} collections in one call. Songs are not deleted.`,
        inputSchema: collectionSongsSchema,
        permission: "collection.update",
        execute: async ({ updates }, authInfo) => {
          const context = requireMcpContext(authInfo);
          return runBatch(updates, (update) => collectionRemoveSongs(context, update));
        },
      },
      authInfo,
    ),
  ];
};
