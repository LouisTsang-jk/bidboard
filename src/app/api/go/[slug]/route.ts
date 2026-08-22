import { createHmac } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/db/client";
import { listings } from "@/db/schema";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!hasDatabase()) return new NextResponse("Listing not found", { status: 404 });
  const { slug } = await params;
  const [listing] = await getDb()
    .select({ canonicalUrl: listings.canonicalUrl })
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);
  if (!listing) return new NextResponse("Listing not found", { status: 404 });

  const redis = getRedis();
  if (redis) {
    const today = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = request.headers.get("user-agent") ?? "unknown";
    const hour = new Date().toISOString().slice(0, 13);
    const visitor = createHmac(
      "sha256",
      process.env.VISITOR_HASH_SECRET ?? "local-development-only",
    )
      .update(`${ip}:${ua}:${hour}`)
      .digest("hex");
    await redis
      .multi()
      .hincrby(`clicks:${today}`, slug, 1)
      .expire(`clicks:${today}`, 172_800)
      .pfadd(`clicks:unique:${today}:${slug}`, visitor)
      .expire(`clicks:unique:${today}:${slug}`, 172_800)
      .exec()
      .catch(() => undefined);
  }

  const destination = new URL(listing.canonicalUrl);
  if (!destination.searchParams.has("utm_source")) {
    destination.searchParams.set("utm_source", "outbid.website");
  }
  return NextResponse.redirect(destination, { status: 302 });
}
