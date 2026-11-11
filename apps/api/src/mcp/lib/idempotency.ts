import { createHash } from "node:crypto";
import { createCache } from "@hosanna/cache";

type Entry = { result: unknown; hash: string };
type Inflight = { hash: string; promise: Promise<unknown> };

const TTL_MS = 10 * 60 * 1000;
const store = createCache({ namespace: "mcp:idem", ttlMs: TTL_MS });
/** Coalesce concurrent same-id runs so two callers don't both execute `run`. */
const inflight = new Map<string, Inflight>();

export class IdempotencyConflictError extends Error {
  readonly code = "IDEMPOTENCY_CONFLICT" as const;

  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export function payloadHash(payload: unknown): string {
  const normalized = JSON.stringify(payload ?? null, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
      );
    }
    return v;
  });
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export async function withClientRequestId<T>(
  orgId: string,
  clientRequestId: string | undefined,
  run: () => Promise<T>,
  payload?: unknown,
): Promise<T> {
  const id = clientRequestId?.trim();
  if (!id) return run();

  const hash = payloadHash(payload);
  const key = `${orgId}:${id}`;
  const hit = await store.get<Entry>(key);
  if (hit) {
    if (hit.hash !== hash) {
      throw new IdempotencyConflictError(
        `clientRequestId "${id}" was already used with a different payload`,
      );
    }
    return hit.result as T;
  }

  const pending = inflight.get(key);
  if (pending) {
    if (pending.hash !== hash) {
      throw new IdempotencyConflictError(
        `clientRequestId "${id}" was already used with a different payload`,
      );
    }
    return pending.promise as Promise<T>;
  }

  const promise = (async () => {
    try {
      // Another waiter may have populated the store while we were scheduling.
      const again = await store.get<Entry>(key);
      if (again) {
        if (again.hash !== hash) {
          throw new IdempotencyConflictError(
            `clientRequestId "${id}" was already used with a different payload`,
          );
        }
        return again.result as T;
      }

      const result = await run();
      await store.set(key, { result, hash });
      return result;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, { hash, promise });
  return promise as Promise<T>;
}
