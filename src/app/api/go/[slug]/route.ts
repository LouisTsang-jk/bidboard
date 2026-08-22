import { createHmac } from "node:crypto";

import { eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";

import { getDb, hasDatabase } from "@/db/client";
import { listings } from "@/db/schema";
import { trackClick } from "@/lib/click-tracking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!hasDatabase()) return new NextResponse("Listing not found", { status: 404 });
  const { slug } = await params;
  const [listing] = await getDb()
    .select({ id: listings.id, canonicalUrl: listings.canonicalUrl })
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);
  if (!listing) return new NextResponse("Listing not found", { status: 404 });

  const now = new Date();
  const metricDate = now.toISOString().slice(0, 10);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "unknown";
  const hour = now.toISOString().slice(0, 13);
  const visitorHash = createHmac(
    "sha256",
    process.env.VISITOR_HASH_SECRET ?? "local-development-only",
  )
    .update(`${ip}:${ua}:${hour}`)
    .digest("hex");

  after(() => trackClick({ listingId: listing.id, slug, metricDate, visitorHash }));

  const destination = new URL(listing.canonicalUrl);
  if (!destination.searchParams.has("utm_source")) {
    destination.searchParams.set("utm_source", "outbid.website");
  }
  return NextResponse.redirect(destination, { status: 302 });
}
