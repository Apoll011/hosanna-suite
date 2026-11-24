import type { AuthInfo } from "@modelcontextprotocol/server";
import type { LogosToolFactory } from "@hosanna/logos-ai/tools";
import { z } from "zod";
import { requireMcpContext } from "../context.js";
import {
  collectionAddSongs,
  collectionRemoveSongs,
  createCollection,
  createFolder,
  updateCollection,
  updateFolder,
} from "../lib/libraryCrud.js";
import { MAX_BATCH, runBatch } from "../lib/runBatch.js";
import { FOLDER_COLOR_IDS, FOLDER_ICON_IDS } from "../lib/studioUi.js";

const folderColorSchema = z.enum(FOLDER_COLOR_IDS);
const folderIconSchema = z.enum(FOLDER_ICON_IDS);

export const libraryBatchToolFactory: LogosToolFactory = (context) => {
  const authInfo = context.authInfo as AuthInfo | undefined;
  return [
    {
      name: "folders_create_many",
      description: `Create up to ${MAX_BATCH} folders in one call. Each item returns its own result.`,
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
      apps: ["music"],
      permission: "folder.create",
      requiresEntitlement: true,
      execute: async (input) => {
        const { folders } = z
          .object({
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
          })
          .parse(input);
        const context = requireMcpContext(authInfo);
        return runBatch(folders, (folder) => createFolder(context, folder));
      },
    },
    {
      name: "folders_update_many",
      description: `Rename, move, or recolor up to ${MAX_BATCH} folders in one call. Each item requires folderId and updatedAt.`,
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
      apps: ["music"],
      permission: "folder.update",
      requiresEntitlement: true,
      execute: async (input) => {
        const { updates } = z
          .object({
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
          })
          .parse(input);
        const context = requireMcpContext(authInfo);
        return runBatch(updates, (update) => updateFolder(context, update));
      },
    },
    {
      name: "collections_update_many",
      description: `Update metadata on up to ${MAX_BATCH} collections in one call. Each item requires collectionId and updatedAt.`,
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
      apps: ["music"],
      permission: "collection.update",
      requiresEntitlement: true,
      execute: async (input) => {
        const { updates } = z
          .object({
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
          })
          .parse(input);
        const context = requireMcpContext(authInfo);
        return runBatch(updates, (update) => updateCollection(context, update));
      },
    },
    {
      name: "collections_add_songs_many",
      description: `Add songs to up to ${MAX_BATCH} collections in one call.`,
      inputSchema: z.object({
        updates: z
          .array(
            z.object({
              collectionId: z.string().uuid(),
              songIds: z.array(z.string().uuid()).min(1),
            }),
          )
          .min(1)
          .max(MAX_BATCH),
      }),
      apps: ["music"],
      permission: "collection.update",
      requiresEntitlement: true,
      execute: async (input) => {
        const { updates } = z
          .object({
            updates: z
              .array(
                z.object({
                  collectionId: z.string().uuid(),
                  songIds: z.array(z.string().uuid()).min(1),
                }),
              )
              .min(1)
              .max(MAX_BATCH),
          })
          .parse(input);
        const context = requireMcpContext(authInfo);
        return runBatch(updates, (update) => collectionAddSongs(context, update));
      },
    },
    {
      name: "collections_remove_songs_many",
      description: `Remove songs from up to ${MAX_BATCH} collections in one call. Songs are not deleted.`,
      inputSchema: z.object({
        updates: z
          .array(
            z.object({
              collectionId: z.string().uuid(),
              songIds: z.array(z.string().uuid()).min(1),
            }),
          )
          .min(1)
          .max(MAX_BATCH),
      }),
      apps: ["music"],
      permission: "collection.update",
      requiresEntitlement: true,
      execute: async (input) => {
        const { updates } = z
          .object({
            updates: z
              .array(
                z.object({
                  collectionId: z.string().uuid(),
                  songIds: z.array(z.string().uuid()).min(1),
                }),
              )
              .min(1)
              .max(MAX_BATCH),
          })
          .parse(input);
        const context = requireMcpContext(authInfo);
        return runBatch(updates, (update) => collectionRemoveSongs(context, update));
      },
    },
  ];
};
