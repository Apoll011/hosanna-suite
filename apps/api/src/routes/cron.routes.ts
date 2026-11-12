import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { syncCache } from "../services/syncCache.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

export const cronRouter = Router();

function requireCronSecret(req: Request, _res: Response, next: NextFunction) {
  if (!env.cronSecret) return next(AppError.forbidden("CRON_SECRET not configured."));
  if (req.headers["authorization"] !== `Bearer ${env.cronSecret}`) {
    return next(AppError.forbidden("Invalid cron secret."));
  }
  next();
}

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Soft-deleted rows past purgeAt, plus stuck rows that never got a purgeAt. */
function expiredTrashWhere(now: Date) {
  const retentionCutoff = new Date(now.getTime() - TRASH_RETENTION_MS);
  return {
    deleted: true as const,
    OR: [{ purgeAt: { lte: now } }, { purgeAt: null, updatedAt: { lte: retentionCutoff } }],
  };
}

// GET|POST /api/cron/purge-trash — permanently delete records past their purgeAt
async function purgeTrashHandler(_req: Request, res: Response) {
  const now = new Date();
  const trashWhere = expiredTrashWhere(now);
  const dispatchCutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const songs = await prisma.song.deleteMany({ where: trashWhere });
  const [folders, collections, services, agendaEvents, reminderDispatches] = await Promise.all([
    prisma.folder.deleteMany({ where: trashWhere }),
    prisma.collection.deleteMany({ where: trashWhere }),
    prisma.service.deleteMany({ where: trashWhere }),
    prisma.agendaEvent.deleteMany({ where: trashWhere }),
    prisma.agendaReminderDispatch.deleteMany({
      where: { sentAt: { lt: dispatchCutoff } },
    }),
  ]);

  const totalPurged =
    songs.count + folders.count + collections.count + services.count + agendaEvents.count;
  if (totalPurged > 0) {
    await syncCache.invalidateAll();
  }

  res.json({
    purged: {
      songs: songs.count,
      folders: folders.count,
      collections: collections.count,
      services: services.count,
      agendaEvents: agendaEvents.count,
      reminderDispatches: reminderDispatches.count,
    },
  });
}

cronRouter.get("/purge-trash", requireCronSecret, asyncHandler(purgeTrashHandler));
cronRouter.post("/purge-trash", requireCronSecret, asyncHandler(purgeTrashHandler));
