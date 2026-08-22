import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db/client";
import { listings } from "@/db/schema";

import { getRedis } from "./redis";

export type LeaderboardItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string | null;
  totalAmountMinor: string;
  clickCount: string;
  firstPaidAt: string | null;
  lastPaidAt: string | null;
};

const FRESH_KEY = "leaderboard:v1:top:100";
const STALE_KEY = "leaderboard:v1:stale";
const LOCK_KEY = "leaderboard:v1:rebuild-lock";

const demoListings: LeaderboardItem[] = [
  {
    id: "demo-01",
    slug: "northstar-labs",
    title: "Northstar Labs",
    description: "A research studio making small, sharp tools for ambitious internet teams.",
    canonicalUrl: "https://example.com/northstar",
    imageUrl: null,
    totalAmountMinor: "128500",
    clickCount: "3841",
    firstPaidAt: "2026-08-19T08:00:00.000Z",
    lastPaidAt: "2026-08-22T01:12:00.000Z",
  },
  {
    id: "demo-02",
    slug: "tiny-signal",
    title: "Tiny Signal",
    description: "Product analytics that tells you what changed, without a wall of charts.",
    canonicalUrl: "https://example.com/tiny-signal",
    imageUrl: null,
    totalAmountMinor: "86000",
    clickCount: "2190",
    firstPaidAt: "2026-08-20T05:00:00.000Z",
    lastPaidAt: "2026-08-22T00:42:00.000Z",
  },
  {
    id: "demo-03",
    slug: "after-dark",
    title: "After Dark",
    description: "A weekly field guide to unusual software, design, and independent business.",
    canonicalUrl: "https://example.com/after-dark",
    imageUrl: null,
    totalAmountMinor: "42500",
    clickCount: "1108",
    firstPaidAt: "2026-08-21T02:00:00.000Z",
    lastPaidAt: "2026-08-21T20:25:00.000Z",
  },
  {
    id: "demo-04",
    slug: "glint-api",
    title: "Glint API",
    description: "One clean endpoint for thumbnails, screenshots, and social preview images.",
    canonicalUrl: "https://example.com/glint",
    imageUrl: null,
    totalAmountMinor: "19000",
    clickCount: "702",
    firstPaidAt: "2026-08-21T11:00:00.000Z",
    lastPaidAt: "2026-08-21T11:00:00.000Z",
  },
  {
    id: "demo-05",
    slug: "workbench-fm",
    title: "Workbench FM",
    description: "Focus radio made from field recordings, machine hum, and soft synthesis.",
    canonicalUrl: "https://example.com/workbench",
    imageUrl: null,
    totalAmountMinor: "500",
    clickCount: "96",
    firstPaidAt: "2026-08-22T01:30:00.000Z",
    lastPaidAt: "2026-08-22T01:30:00.000Z",
  },
];

async function queryLeaderboard(): Promise<LeaderboardItem[]> {
  if (!hasDatabase()) return demoListings;
  const rows = await getDb()
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      description: listings.description,
      canonicalUrl: listings.canonicalUrl,
      imageUrl: listings.imageUrl,
      totalAmountMinor: listings.totalAmountMinor,
      clickCount: listings.clickCount,
      firstPaidAt: listings.firstPaidAt,
      lastPaidAt: listings.lastPaidAt,
    })
    .from(listings)
    .where(eq(listings.status, "ACTIVE"))
    .orderBy(desc(listings.totalAmountMinor), asc(listings.firstPaidAt), asc(listings.id))
    .limit(100);

  return rows.map((row) => ({
    ...row,
    totalAmountMinor: row.totalAmountMinor.toString(),
    clickCount: row.clickCount.toString(),
    firstPaidAt: row.firstPaidAt?.toISOString() ?? null,
    lastPaidAt: row.lastPaidAt?.toISOString() ?? null,
  }));
}

function parseCache(value: string | null): LeaderboardItem[] | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as LeaderboardItem[];
  } catch {
    return null;
  }
}

export async function getLeaderboard(): Promise<LeaderboardItem[]> {
  const redis = getRedis();
  if (!redis) return queryLeaderboard();

  try {
    const fresh = parseCache(await redis.get(FRESH_KEY));
    if (fresh) return fresh;

    const lock = await redis.set(LOCK_KEY, "1", "PX", 1_500, "NX");
    if (lock === "OK") {
      const rows = await queryLeaderboard();
      const serialized = JSON.stringify(rows);
      const ttl = 10 + Math.floor(Math.random() * 10);
      await redis.multi().set(FRESH_KEY, serialized, "EX", ttl).set(STALE_KEY, serialized, "EX", 300).del(LOCK_KEY).exec();
      return rows;
    }

    const stale = parseCache(await redis.get(STALE_KEY));
    return stale ?? queryLeaderboard();
  } catch {
    const stale = await redis.get(STALE_KEY).catch(() => null);
    return parseCache(stale) ?? queryLeaderboard();
  }
}

export async function invalidateLeaderboard(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(FRESH_KEY).catch(() => undefined);
}

export async function rebuildLeaderboard(): Promise<LeaderboardItem[]> {
  const rows = await queryLeaderboard();
  const redis = getRedis();
  if (redis) {
    const serialized = JSON.stringify(rows);
    await redis.multi().set(FRESH_KEY, serialized, "EX", 15).set(STALE_KEY, serialized, "EX", 300).exec();
  }
  return rows;
}
