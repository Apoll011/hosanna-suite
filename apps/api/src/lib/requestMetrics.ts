import { AsyncLocalStorage } from "node:async_hooks";
import type { Request, RequestHandler } from "express";
import { randomUUID } from "node:crypto";

type RequestMetrics = {
  requestId: string;
  startedAt: number;
  databaseQueryCount: number;
  databaseDurationMs: number;
  authenticationDurationMs: number | null;
};

const requestMetrics = new AsyncLocalStorage<RequestMetrics>();

export const requestMetricsMiddleware: RequestHandler = (req, res, next) => {
  const metrics: RequestMetrics = {
    requestId: req.get("x-vercel-id")?.slice(0, 128) || randomUUID(),
    startedAt: performance.now(),
    databaseQueryCount: 0,
    databaseDurationMs: 0,
    authenticationDurationMs: null,
  };

  res.on("finish", () => {
    const route = req.route
      ? `${req.baseUrl}${typeof req.route.path === "string" ? req.route.path : "[route]"}`
      : "unmatched";
    const durationMs = Math.round((performance.now() - metrics.startedAt) * 100) / 100;

    if (durationMs >= 1_000 || Math.random() < 0.1) {
      console.info(
        JSON.stringify({
          event: "http.request.complete",
          requestId: metrics.requestId,
          method: req.method,
          route,
          statusCode: res.statusCode,
          durationMs,
          authenticationDurationMs: metrics.authenticationDurationMs,
          databaseQueryCount: metrics.databaseQueryCount,
          databaseDurationMs: Math.round(metrics.databaseDurationMs * 100) / 100,
        }),
      );
    }
  });

  requestMetrics.run(metrics, next);
};

export function recordAuthenticationDuration(durationMs: number): void {
  const metrics = requestMetrics.getStore();
  if (metrics) metrics.authenticationDurationMs = durationMs;
}

export function recordDatabaseDuration(durationMs: number): void {
  const metrics = requestMetrics.getStore();
  if (!metrics) return;
  metrics.databaseQueryCount += 1;
  metrics.databaseDurationMs += durationMs;
}
