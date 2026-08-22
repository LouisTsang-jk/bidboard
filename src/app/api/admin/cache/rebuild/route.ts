import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { rebuildLeaderboard } from "@/lib/leaderboard";

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await rebuildLeaderboard();
  return NextResponse.json({ ok: true, rebuilt: rows.length });
}
