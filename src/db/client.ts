import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

declare global {
  var __bidboardPool: Pool | undefined;
  var __bidboardDb: NodePgDatabase<typeof schema> | undefined;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalThis.__bidboardPool) {
    globalThis.__bidboardPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX ?? 8),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 3_000,
      allowExitOnIdle: true,
      ssl:
        process.env.DATABASE_URL.includes("localhost") ||
        process.env.DATABASE_URL.includes("127.0.0.1")
          ? undefined
          : { rejectUnauthorized: false },
    });
  }

  return globalThis.__bidboardPool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalThis.__bidboardDb) {
    globalThis.__bidboardDb = drizzle(getPool(), { schema });
  }

  return globalThis.__bidboardDb;
}
