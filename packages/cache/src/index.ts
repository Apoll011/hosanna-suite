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

/** Better Auth secondary storage contract (TTL in seconds). */
export type SecondaryStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  getAndDelete: (key: string) => Promise<string | null>;
  /** Atomic INCR; returns new count. `ttl` (seconds) applied when the key is created. */
  increment: (key: string, ttl?: number) => Promise<number>;
};

type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { EX?: number }) => Promise<unknown>;
  del: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  getDel?: (key: string) => Promise<string | null>;
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
let sharedRedisClient: Promise<RedisClient> | null = null;
let redisModule: Promise<typeof import("@keyv/redis")> | null = null;

function loadRedisModule() {
  return (redisModule ??= import("@keyv/redis"));
}

async function sharedRedis(url: string): Promise<RedisClient> {
  if (sharedRedisClient && sharedRedisUrl === url) return sharedRedisClient;
  sharedRedisUrl = url;
  sharedRedisClient = (async () => {
    const { createClient } = await loadRedisModule();
    const client = createClient({ url });
    client.on("error", (err: unknown) => {
      console.error("[@hosanna/cache] redis error:", err);
    });
    await client.connect();
    return client as unknown as RedisClient;
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
 * Uses the shared Redis client when REDIS_URL is set.
 */
export function createSecondaryStorage(opts?: {
  /** Key prefix. Default `ba`. */
  namespace?: string;
  redisUrl?: string | null;
}): SecondaryStorage | null {
  const redisUrl = opts?.redisUrl ?? process.env.REDIS_URL ?? null;
  if (!redisUrl) return null;

  const prefix = `${opts?.namespace ?? "ba"}:`;
  const clientP = sharedRedis(redisUrl);
  const fullKey = (key: string) => `${prefix}${key}`;

  return {
    get: async (key) => (await clientP).get(fullKey(key)),
    set: async (key, value, ttlSeconds) => {
      const client = await clientP;
      if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
        await client.set(fullKey(key), value, { EX: ttlSeconds });
      } else {
        await client.set(fullKey(key), value);
      }
    },
    delete: async (key) => {
      await (await clientP).del(fullKey(key));
    },
    getAndDelete: async (key) => {
      const client = await clientP;
      const k = fullKey(key);
      if (typeof client.getDel === "function") return client.getDel(k);
      const value = await client.get(k);
      if (value != null) await client.del(k);
      return value;
    },
    increment: async (key, ttlSeconds) => {
      const client = await clientP;
      const k = fullKey(key);
      const next = await client.incr(k);
      if (typeof ttlSeconds === "number" && ttlSeconds > 0 && next === 1) {
        await client.expire(k, ttlSeconds);
      }
      return next;
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
