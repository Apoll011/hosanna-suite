import { env } from "@/lib/config/env";
import { PrismaClient } from "@hosanna/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
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

if (env.isVercel) {
  attachDatabasePool(pool);
}

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
