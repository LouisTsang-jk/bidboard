import { and, asc, eq, isNull, lte, sql } from "drizzle-orm";

import { getDb, hasDatabase } from "./db/client";
import { listingDailyMetrics, listings, outbox } from "./db/schema";
import { getRedis } from "./lib/redis";

let running = true;
let lastClickFlush = 0;

function stop() {
  running = false;
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function processOutbox(): Promise<number> {
  if (!hasDatabase()) return 0;
  const db = getDb();
  const events = await db
    .select({ id: outbox.id, topic: outbox.topic })
    .from(outbox)
    .where(and(isNull(outbox.processedAt), lte(outbox.availableAt, new Date())))
    .orderBy(asc(outbox.availableAt))
    .limit(50);
  if (events.length === 0) return 0;

  const redis = getRedis();
  if (events.some((event) => event.topic === "LEADERBOARD_CHANGED")) {
    await redis?.del("leaderboard:v1:top:100").catch(() => undefined);
  }
  await Promise.all(
    events.map((event) =>
      db.update(outbox).set({ processedAt: new Date() }).where(eq(outbox.id, event.id)),
    ),
  );
  return events.length;
}

async function flushClicks(): Promise<number> {
  if (!hasDatabase()) return 0;
  const redis = getRedis();
  if (!redis) return 0;
  const metricDate = new Date().toISOString().slice(0, 10);
  const key = `clicks:${metricDate}`;
  const flattened = (await redis.eval(
    "local d=redis.call('HGETALL',KEYS[1]); redis.call('DEL',KEYS[1]); return d",
    1,
    key,
  )) as string[];
  if (flattened.length === 0) return 0;

  const db = getDb();
  for (let index = 0; index < flattened.length; index += 2) {
    const slug = flattened[index];
    const count = BigInt(flattened[index + 1] ?? "0");
    if (!slug || count <= 0n) continue;
    const [listing] = await db
      .update(listings)
      .set({ clickCount: sql`${listings.clickCount} + ${count}`, updatedAt: new Date() })
      .where(eq(listings.slug, slug))
      .returning({ id: listings.id });
    if (!listing) continue;
    const uniqueEstimate = BigInt(
      await redis.pfcount(`clicks:unique:${metricDate}:${slug}`).catch(() => 0),
    );
    await db
      .insert(listingDailyMetrics)
      .values({ listingId: listing.id, metricDate, clicks: count, uniqueClicksEstimate: uniqueEstimate })
      .onConflictDoUpdate({
        target: [listingDailyMetrics.listingId, listingDailyMetrics.metricDate],
        set: {
          clicks: sql`${listingDailyMetrics.clicks} + ${count}`,
          uniqueClicksEstimate: uniqueEstimate,
        },
      });
  }
  return flattened.length / 2;
}

async function main() {
  const pollMs = Number(process.env.WORKER_POLL_MS ?? 5_000);
  while (running) {
    try {
      const outboxCount = await processOutbox();
      if (Date.now() - lastClickFlush >= 60_000) {
        await flushClicks();
        lastClickFlush = Date.now();
      }
      if (outboxCount > 0) console.info(JSON.stringify({ event: "outbox_processed", count: outboxCount }));
    } catch (error) {
      console.error(JSON.stringify({
        event: "worker_error",
        message: error instanceof Error ? error.message : "unknown",
      }));
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  await getRedis()?.quit().catch(() => undefined);
}

void main();
