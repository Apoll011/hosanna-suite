import { Router } from "express";
import { assertUser } from "../middleware/auth.js";
import { ServiceSongAnnotationService } from "../services/serviceSongAnnotation.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

export const annotationRouter = Router({ mergeParams: true });

annotationRouter.get(
  "/services/:serviceId/songs/:songId/annotation",
  assertUser,
  asyncHandler(async (req, res) => {
    const { serviceId, songId } = req.params;
    const serviceSongAnnotationService = new ServiceSongAnnotationService(
      req.db!,
      req.orgId!,
      req.user!.id,
    );

    const row = await serviceSongAnnotationService.get(serviceId, songId);
    if (!row) {
      throw AppError.notFound("ELEMENT_NOT_FOUND", "Annotation not found.");
    }

    res.json({
      canvasDataBase64: row.canvasData.toString("base64"),
      updatedAt: row.updatedAt.toISOString(),
      updatedById: row.updatedById,
      revision: row.updatedAt.getTime(),
    });
  }),
);

annotationRouter.put(
  "/services/:serviceId/songs/:songId/annotation",
  assertUser,
  asyncHandler(async (req, res) => {
    const serviceSongAnnotationService = new ServiceSongAnnotationService(
      req.db!,
      req.orgId!,
      req.user!.id,
    );
    const { serviceId, songId } = req.params;
    const { canvasDataBase64 } = req.body as { canvasDataBase64?: unknown };

    if (typeof canvasDataBase64 !== "string") {
      throw AppError.badRequest("canvasDataBase64 is required");
    }

    const row = await serviceSongAnnotationService.upsert({
      serviceId,
      songId,
      canvasData: Buffer.from(canvasDataBase64, "base64"),
    });

    res.json({
      updatedAt: row.updatedAt.toISOString(),
      updatedById: row.updatedById,
      revision: row.updatedAt.getTime(),
    });
  }),
);
