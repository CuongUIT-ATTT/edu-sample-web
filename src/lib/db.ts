import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

/**
 * Lazy-initialized pg.Pool — only created on first access.
 * Prevents serverless cold-start crashes when DATABASE_URL is missing or unreachable.
 */
function getPool(): pg.Pool {
  if (!globalForPrisma.pgPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://mock_user:mock_password@localhost:5432/mock_db?schema=public";
    globalForPrisma.pgPool = new pg.Pool({ connectionString });
  }
  return globalForPrisma.pgPool;
}

/**
 * Lazy-initialized PrismaClient — only created on first access.
 * Uses the lazy pool above so neither Pool nor Prisma crash at module import time.
 */
function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const pool = getPool();
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

/**
 * Proxy-based lazy db accessor.
 * `import { db } from "@/lib/db"` works identically to before,
 * but the actual PrismaClient is only constructed on first property access (query).
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Export pool lazily for test SQL round-trip counting (Prisma adapter pg không emit $on("query"))
export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop, receiver) {
    const p = getPool();
    const value = Reflect.get(p, prop, receiver);
    if (typeof value === "function") {
      return value.bind(p);
    }
    return value;
  },
});
