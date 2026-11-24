// SPDX-License-Identifier: AGPL-3.0-only
import { env } from "@/lib/config/env";
import { PrismaClient } from "@hosanna/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolClient } from "pg";
import {
  recordDatabaseAcquireDuration,
  recordDatabaseQueryDuration,
} from "@/lib/performance/requestMetrics";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: env.databaseUrl,
    max: env.dbPoolMax,
    idleTimeoutMillis: env.isVercel ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 10_000,
  });

const connect = pool.connect.bind(pool);
pool.connect = new Proxy(connect, {
  apply(target, thisArg, args) {
    const startedAt = performance.now();
    const result = Reflect.apply(target, thisArg, args);
    if (!(result instanceof Promise)) return result;

    return result.then(
      (client) => {
        recordDatabaseAcquireDuration(performance.now() - startedAt);
        return client;
      },
      (error: unknown) => {
        recordDatabaseAcquireDuration(performance.now() - startedAt);
        throw error;
      },
    );
  },
});

const instrumentedClients = new WeakSet<PoolClient>();

pool.on("error", (error) => {
  console.error("[Auth DB] Pool error:", error);
});

pool.on("connect", () => {
  console.info(
    JSON.stringify({
      event: "auth.database.pool.connect",
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    }),
  );
});

pool.on("acquire", (client) => {
  if (client && !instrumentedClients.has(client)) {
    instrumentedClients.add(client);
    const query = client.query.bind(client);
    client.query = new Proxy(query, {
      apply(target, thisArg, args) {
        const startedAt = performance.now();
        const result = Reflect.apply(target, thisArg, args);
        if (result instanceof Promise) {
          return result.finally(() => {
            recordDatabaseQueryDuration(performance.now() - startedAt);
          });
        }
        return result;
      },
    });
  }

  if (pool.waitingCount > 0) {
    console.warn(
      JSON.stringify({
        event: "auth.database.pool.waiting",
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      }),
    );
  }
});

pool.on("remove", () => {
  console.info(
    JSON.stringify({
      event: "auth.database.pool.remove",
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    }),
  );
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
