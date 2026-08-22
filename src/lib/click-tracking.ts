import "server-only";

import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db/client";
import { listingDailyMetrics, listings } from "@/db/schema";

import { getRedis } from "./redis";

const BUFFER_TTL_SECONDS = 172_800;
const FLUSH_LOCK_MS = 5_000;
const BATCH_WINDOW_MS = 25;

const DRAIN_BATCH_SCRIPT = `
local count = redis.call("HGET", KEYS[1], ARGV[1])
if count then
  redis.call("HDEL", KEYS[1], ARGV[1])
end
if redis.call("GET", KEYS[2]) == ARGV[2] then
  redis.call("DEL", KEYS[2])
end
return count or "0"
`;

type Click = {
  listingId: string;
  slug: string;
  metricDate: string;
  visitorHash: string;
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}

async function persistClickBatch(
  listingId: string,
  metricDate: string,
  count: bigint,
  uniqueEstimate: bigint | null,
): Promise<void> {
  if (!hasDatabase() || count <= 0n) return;
  const db = getDb();

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(listings)
      .set({
        clickCount: sql`${listings.clickCount} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId))
      .returning({ id: listings.id });
    if (!updated) throw new Error("LISTING_NOT_FOUND");

    await tx
      .insert(listingDailyMetrics)
      .values({
        listingId,
        metricDate,
        clicks: count,
        uniqueClicksEstimate: uniqueEstimate ?? 0n,
      })
      .onConflictDoUpdate({
        target: [listingDailyMetrics.listingId, listingDailyMetrics.metricDate],
        set:
          uniqueEstimate === null
            ? {
                clicks: sql`${listingDailyMetrics.clicks} + ${count}`,
              }
            : {
                clicks: sql`${listingDailyMetrics.clicks} + ${count}`,
                uniqueClicksEstimate: sql`greatest(${listingDailyMetrics.uniqueClicksEstimate}, ${uniqueEstimate})`,
              },
      });
  });
}

async function persistDirect(click: Click): Promise<void> {
  try {
    await persistClickBatch(click.listingId, click.metricDate, 1n, null);
  } catch (error) {
    console.error(
      JSON.stringify({ event: "click_persist_failed", message: errorMessage(error) }),
    );
  }
}

export async function trackClick(click: Click): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    await persistDirect(click);
    return;
  }

  const bufferKey = `clicks:${click.metricDate}`;
  const uniqueKey = `clicks:unique:${click.metricDate}:${click.slug}`;
  const lockKey = `clicks:flush-lock:${click.metricDate}:${click.slug}`;
  const lockToken = randomUUID();

  try {
    const results = await redis
      .multi()
      .hincrby(bufferKey, click.slug, 1)
      .expire(bufferKey, BUFFER_TTL_SECONDS)
      .pfadd(uniqueKey, click.visitorHash)
      .expire(uniqueKey, BUFFER_TTL_SECONDS)
      .exec();
    if (!results || results.some(([error]) => error !== null)) {
      throw new Error("REDIS_CLICK_BUFFER_FAILED");
    }
  } catch (error) {
    console.error(
      JSON.stringify({ event: "click_buffer_failed", message: errorMessage(error) }),
    );
    await persistDirect(click);
    return;
  }

  const ownsFlush = await redis
    .set(lockKey, lockToken, "PX", FLUSH_LOCK_MS, "NX")
    .catch(() => null);
  if (ownsFlush !== "OK") return;

  await delay(BATCH_WINDOW_MS);

  let count: bigint;
  try {
    const value = await redis.eval(
      DRAIN_BATCH_SCRIPT,
      2,
      bufferKey,
      lockKey,
      click.slug,
      lockToken,
    );
    count = BigInt(String(value));
  } catch (error) {
    console.error(
      JSON.stringify({ event: "click_drain_failed", message: errorMessage(error) }),
    );
    return;
  }
  if (count <= 0n) return;

  const uniqueEstimate = BigInt(await redis.pfcount(uniqueKey).catch(() => 0));
  try {
    await persistClickBatch(click.listingId, click.metricDate, count, uniqueEstimate);
  } catch (error) {
    await redis
      .multi()
      .hincrby(bufferKey, click.slug, count.toString())
      .expire(bufferKey, BUFFER_TTL_SECONDS)
      .exec()
      .catch(() => undefined);
    console.error(
      JSON.stringify({
        event: "click_persist_failed",
        count: count.toString(),
        message: errorMessage(error),
      }),
    );
  }
}
