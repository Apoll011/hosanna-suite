import { createHash } from "node:crypto";
import { createCache } from "@hosanna/cache";

type Entry = { result: unknown; hash: string };

const TTL_MS = 10 * 60 * 1000;
const store = createCache({ namespace: "mcp:idem", ttlMs: TTL_MS });

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

  const result = await run();
  await store.set(key, { result, hash });
  return result;
}
