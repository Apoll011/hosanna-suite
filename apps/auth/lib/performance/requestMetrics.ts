import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type RequestMetrics = {
  requestId: string;
  route: string;
  startedAt: number;
  databaseAcquireCount: number;
  databaseAcquireDurationMs: number;
  databaseAcquireMaxMs: number;
  databaseQueryCount: number;
  databaseQueryDurationMs: number;
  databaseQueryMaxMs: number;
};

const requestMetrics = new AsyncLocalStorage<RequestMetrics>();

export function withRequestMetrics(
  request: Request,
  route: string,
  handler: () => Response | Promise<Response>,
): Promise<Response> {
  const metrics: RequestMetrics = {
    requestId: request.headers.get("x-vercel-id")?.slice(0, 128) || randomUUID(),
    route,
    startedAt: performance.now(),
    databaseAcquireCount: 0,
    databaseAcquireDurationMs: 0,
    databaseAcquireMaxMs: 0,
    databaseQueryCount: 0,
    databaseQueryDurationMs: 0,
    databaseQueryMaxMs: 0,
  };

  return requestMetrics.run(metrics, async () => {
    let statusCode = 500;
    try {
      const response = await handler();
      statusCode = response.status;
      return response;
    } finally {
      const durationMs = performance.now() - metrics.startedAt;
      if (durationMs >= 1_000 || Math.random() < 0.1) {
        console.info(
          JSON.stringify({
            event: "auth.http.request.complete",
            requestId: metrics.requestId,
            route: metrics.route,
            method: request.method,
            statusCode,
            durationMs: Math.round(durationMs * 100) / 100,
            databaseAcquireCount: metrics.databaseAcquireCount,
            databaseAcquireDurationMs: Math.round(metrics.databaseAcquireDurationMs * 100) / 100,
            databaseAcquireMaxMs: Math.round(metrics.databaseAcquireMaxMs * 100) / 100,
            databaseQueryCount: metrics.databaseQueryCount,
            databaseQueryDurationMs: Math.round(metrics.databaseQueryDurationMs * 100) / 100,
            databaseQueryMaxMs: Math.round(metrics.databaseQueryMaxMs * 100) / 100,
          }),
        );
      }
    }
  });
}

export function recordDatabaseAcquireDuration(durationMs: number): void {
  const metrics = requestMetrics.getStore();
  if (!metrics) return;
  metrics.databaseAcquireCount += 1;
  metrics.databaseAcquireDurationMs += durationMs;
  metrics.databaseAcquireMaxMs = Math.max(metrics.databaseAcquireMaxMs, durationMs);
}

export function recordDatabaseQueryDuration(durationMs: number): void {
  const metrics = requestMetrics.getStore();
  if (!metrics) return;
  metrics.databaseQueryCount += 1;
  metrics.databaseQueryDurationMs += durationMs;
  metrics.databaseQueryMaxMs = Math.max(metrics.databaseQueryMaxMs, durationMs);
}
