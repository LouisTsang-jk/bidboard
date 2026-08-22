import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/db/client";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const redis = getRedis();
  const [databaseResult, redisResult] = await Promise.allSettled([
    hasDatabase() ? getDb().execute(sql`select 1`) : Promise.reject(new Error("not configured")),
    redis ? redis.ping() : Promise.reject(new Error("not configured")),
  ]);
  const database = databaseResult.status === "fulfilled";
  const cache = redisResult.status === "fulfilled";
  return NextResponse.json(
    { ok: database && cache, database, cache, time: new Date().toISOString() },
    { status: database && cache ? 200 : 503 },
  );
}
