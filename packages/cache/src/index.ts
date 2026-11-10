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
  /** Open the underlying store (useful to warm Redis before traffic). */
  ready(): Promise<void>;
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

/** One Redis client for the process — namespaces stay isolated via Keyv `namespace`. */
let sharedRedisUrl: string | null = null;
let sharedRedisClient: Promise<unknown> | null = null;
let redisModule: Promise<typeof import("@keyv/redis")> | null = null;

function loadRedisModule() {
  return (redisModule ??= import("@keyv/redis"));
}

async function sharedRedis(url: string): Promise<unknown> {
  if (sharedRedisClient && sharedRedisUrl === url) return sharedRedisClient;
  sharedRedisUrl = url;
  sharedRedisClient = (async () => {
    const { createClient } = await loadRedisModule();
    const client = createClient({ url });
    client.on("error", (err: unknown) => {
      console.error("[@hosanna/cache] redis error:", err);
    });
    await client.connect();
    return client;
  })();
  return sharedRedisClient;
}

async function openStore(opts: CreateCacheOptions): Promise<KeyvLike> {
  const backend = resolveBackend(opts);
  const ttl = opts.ttlMs;

  if (backend === "redis") {
    const url = resolveRedisUrl(opts);
    if (!url) {
      throw new Error(`@hosanna/cache: redis backend for "${opts.namespace}" needs REDIS_URL`);
    }
    const { createKeyv } = await loadRedisModule();
    const client = await sharedRedis(url);
    // TTL is applied per `set`; namespace isolates keys + clear() per cache.
    return createKeyv(client as never, {
      namespace: opts.namespace,
    }) as KeyvLike;
  }

  return new Keyv({
    namespace: opts.namespace,
    ...(ttl ? { ttl } : {}),
  }) as unknown as KeyvLike;
}

/**
 * Better Auth `secondaryStorage` adapter (string values, TTL in seconds).
 * Uses the same Redis client / namespaces as `createCache` when REDIS_URL is set.
 */
export type SecondaryStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export function createSecondaryStorage(opts?: {
  /** Keyv namespace prefix. Default `ba`. */
  namespace?: string;
  redisUrl?: string | null;
}): SecondaryStorage | null {
  const redisUrl = opts?.redisUrl ?? process.env.REDIS_URL ?? null;
  if (!redisUrl) return null;

  const cache = createCache({
    namespace: opts?.namespace ?? "ba",
    redisUrl,
    backend: "redis",
  });

  return {
    get: async (key) => {
      const value = await cache.get<string>(key);
      return value ?? null;
    },
    set: async (key, value, ttlSeconds) => {
      await cache.set(key, value, typeof ttlSeconds === "number" ? ttlSeconds * 1000 : undefined);
    },
    delete: async (key) => {
      await cache.delete(key);
    },
  };
}

/** Namespaced Keyv cache. Memory by default; set REDIS_URL to use Redis. */
export function createCache(opts: CreateCacheOptions): Cache {
  let store: KeyvLike | undefined;
  let opening: Promise<KeyvLike> | undefined;

  const readyStore = () => {
    if (store) return Promise.resolve(store);
    opening ??= openStore(opts).then((s) => {
      store = s;
      return s;
    });
    return opening;
  };

  return {
    namespace: opts.namespace,
    ready: async () => {
      await readyStore();
    },
    async get<T>(key: string) {
      return (await readyStore()).get<T>(key);
    },
    async set<T>(key: string, value: T, ttlMs?: number) {
      await (await readyStore()).set(key, value, ttlMs ?? opts.ttlMs);
    },
    async delete(key: string) {
      return (await readyStore()).delete(key);
    },
    async clear() {
      await (await readyStore()).clear();
    },
  };
}
