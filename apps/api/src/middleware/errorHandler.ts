import { Prisma } from "@hosanna/db";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { DEFAULT_LOCALE, t } from "../lib/i18n.js";
import { AppError } from "../utils/errors.js";

const isProd = env.nodeEnv === "production" || Boolean(process.env.VERCEL);

export function notFoundHandler(req: Request, res: Response) {
  const locale = req.locale ?? DEFAULT_LOCALE;
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: t(locale, "error.route_not_found", {
        method: req.method,
        path: req.path,
      }),
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const locale = req.locale ?? DEFAULT_LOCALE;

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: t(locale, "error.resource_not_found"),
        },
      });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({
        error: {
          code: "DUPLICATE",
          message: t(locale, "error.duplicate_resource"),
        },
      });
      return;
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: t(locale, "error.internal_error"),
      // Never serialize the raw Error object to clients (stack / internals).
      ...(!isProd && err instanceof Error ? { details: err.message } : {}),
    },
  });
}
