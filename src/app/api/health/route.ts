import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "outbid.website", time: new Date().toISOString() });
}
