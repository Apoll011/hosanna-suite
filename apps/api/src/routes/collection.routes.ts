// SPDX-License-Identifier: AGPL-3.0-only
import { Router } from "express";
import { requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { CollectionService } from "../services/collection.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { idParamSchema } from "../validators/common.validators.js";

export const collectionRouter = Router();

collectionRouter.get(
  "/",
  requirePermission("collection.access"),
  asyncHandler(async (req, res) => {
    const service = new CollectionService(req.db!, req.locale);
    res.json(await service.list());
  }),
);

collectionRouter.get(
  "/:id",
  requirePermission("collection.access"),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const service = new CollectionService(req.db!, req.locale);
    res.json(await service.getById(req.params.id));
  }),
);
