import { timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { listings } from "@/db/schema";
import { invalidateLeaderboard } from "@/lib/leaderboard";

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updated = await getDb()
    .update(listings)
    .set({ status: "HIDDEN", updatedAt: new Date() })
    .where(eq(listings.id, id))
    .returning({ id: listings.id });
  await invalidateLeaderboard();
  return NextResponse.json({ ok: updated.length === 1 });
}
