import type { AuthInfo } from "@modelcontextprotocol/server";
import type { LogosToolFactory } from "@hosanna/logos-ai/tools";
import { z } from "zod";
import { requireMcpContext, songs as songService } from "../context.js";
import { mapToolError } from "../lib/toolErrors.js";
import { MAX_BATCH, runBatch } from "../lib/runBatch.js";
import { serializeSong } from "../tools/songs.js";

const moveManySchema = z.object({
  moves: z
    .array(
      z.object({
        songId: z.string().uuid(),
        updatedAt: z.string(),
        folderId: z.string().uuid().nullable(),
      }),
    )
    .min(1)
    .max(MAX_BATCH),
});

export const songBatchToolFactory: LogosToolFactory = (factoryContext) => {
  const authInfo = factoryContext.authInfo as AuthInfo | undefined;
  return [
    {
      name: "songs_move_many",
      description: `Move up to ${MAX_BATCH} songs to folders or the library root in one call. Each item requires songId and updatedAt.`,
      inputSchema: moveManySchema,
      apps: ["music"],
      permission: "song.update",
      requiresEntitlement: true,
      execute: async (input) => {
        const { moves } = moveManySchema.parse(input);
        const context = requireMcpContext(authInfo);
        return runBatch(
          moves,
          async (move) => ({
            moved: true,
            song: serializeSong(
              await songService(context).move(move.songId, new Date(move.updatedAt), move.folderId),
            ),
          }),
          async (error, move) => {
            let current: unknown;
            try {
              current = serializeSong(await songService(context).getById(move.songId));
            } catch {
              current = undefined;
            }
            return mapToolError(error, { current, field: "updatedAt" });
          },
        );
      },
    },
  ];
};
