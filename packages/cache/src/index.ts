import { Keyv } from "keyv";

export type CacheBackend = "memory" | "redis";

export type CreateCacheOptions = {
  namespace: string;
  /** Default TTL (ms) when `set` omits ttl. */
  ttlMs?: number;
  backend?: CacheBackend;
  redisUrl?: string | null;
};

export type Cache = {
  readonly namespace: string;
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
};

type KeyvLike = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
};

function resolveRedisUrl(opts: CreateCacheOptions): string | null {
  return opts.redisUrl ?? process.env.REDIS_URL ?? null;
}

function resolveBackend(opts: CreateCacheOptions): CacheBackend {
  if (opts.backend) return opts.backend;
  return resolveRedisUrl(opts) ? "redis" : "memory";
}

async function openStore(opts: CreateCacheOptions): Promise<KeyvLike> {
  const backend = resolveBackend(opts);
  const ttl = opts.ttlMs;

  if (backend === "redis") {
    const url = resolveRedisUrl(opts);
    if (!url) {
      throw new Error(
        `@hosanna/cache: redis backend for "${opts.namespace}" needs REDIS_URL`,
      );
    }
    const { createKeyv } = await import("@keyv/redis");
    return createKeyv(url, {
      namespace: opts.namespace,
      ...(ttl ? { ttl } : {}),
    }) as KeyvLike;
  }

  return new Keyv({
    namespace: opts.namespace,
    ...(ttl ? { ttl } : {}),
  }) as unknown as KeyvLike;
}

/** Namespaced Keyv cache. Memory by default; set REDIS_URL to use Redis. */
export function createCache(opts: CreateCacheOptions): Cache {
  let store: KeyvLike | undefined;
  let opening: Promise<KeyvLike> | undefined;

  const ready = () => {
    if (store) return Promise.resolve(store);
    opening ??= openStore(opts).then((s) => {
      store = s;
      return s;
    });
    return opening;
  };

  return {
    namespace: opts.namespace,
    async get<T>(key: string) {
      return (await ready()).get<T>(key);
    },
    async set<T>(key: string, value: T, ttlMs?: number) {
      await (await ready()).set(key, value, ttlMs ?? opts.ttlMs);
    },
    async delete(key: string) {
      return (await ready()).delete(key);
    },
    async clear() {
      await (await ready()).clear();
    },
  };
}
