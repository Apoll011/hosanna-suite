// SPDX-License-Identifier: AGPL-3.0-only
import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AgendaEventService } from "../services/agendaEvent.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { idParamSchema } from "../validators/common.validators.js";

export const listAgendaEventsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const agendaEventRouter = Router();

agendaEventRouter.get(
  "/",
  requirePermission("agenda.access"),
  validate({ query: listAgendaEventsQuerySchema }),
  asyncHandler(async (req, res) => {
    const service = new AgendaEventService(req.db!, req.locale);
    res.json(await service.list(req.query as z.infer<typeof listAgendaEventsQuerySchema>));
  }),
);

agendaEventRouter.get(
  "/:id",
  requirePermission("agenda.access"),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const service = new AgendaEventService(req.db!, req.locale);
    res.json(await service.getById(req.params.id));
  }),
);
