import { env } from "@/lib/config/env";
import { PrismaClient } from "@hosanna/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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

pool.on("acquire", () => {
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
