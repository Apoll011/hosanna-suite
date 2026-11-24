// SPDX-License-Identifier: AGPL-3.0-only
import { Router } from "express";
import { prisma } from "../database/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRouter = Router();

// GET /api/health — no auth. Used by load balancers / uptime checks.
healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", name: "hosanna", timestamp: new Date().toISOString() });
  }),
);
