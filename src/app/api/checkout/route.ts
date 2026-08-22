import { createHash, randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb, hasDatabase } from "@/db/client";
import { checkoutIntents, listings } from "@/db/schema";
import { dollarsToMinor } from "@/lib/money";
import { takeRateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { hashUrl, normalizePublicUrl, slugFromUrl } from "@/lib/url";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().min(3).max(2_048),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(240),
  amount: z.union([z.string(), z.number()]),
  idempotencyKey: z.string().min(16).max(80).optional(),
});

function fingerprint(ip: string, userAgent: string): string {
  const secret = process.env.VISITOR_HASH_SECRET ?? "local-development-only";
  return createHash("sha256").update(`${secret}:${ip}:${userAgent}`).digest("hex");
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Checkout is disabled until PostgreSQL is connected." },
      { status: 503 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the URL, name, description, and bid amount." },
      { status: 400 },
    );
  }

  try {
    const canonicalUrl = normalizePublicUrl(parsed.data.url);
    const amountMinor = dollarsToMinor(parsed.data.amount);
    const requestHeaders = await headers();
    const requesterHash = fingerprint(
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      requestHeaders.get("user-agent") ?? "unknown",
    );
    const rate = await takeRateLimit(`checkout:${requesterHash}`, 5, 600);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Try again shortly." },
        { status: 429 },
      );
    }

    const idempotencyKey = parsed.data.idempotencyKey ?? randomUUID();
    const db = getDb();
    const canonicalUrlHash = hashUrl(canonicalUrl);

    let [listing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.canonicalUrlHash, canonicalUrlHash))
      .limit(1);

    if (!listing) {
      [listing] = await db
        .insert(listings)
        .values({
          slug: slugFromUrl(canonicalUrl),
          canonicalUrl,
          canonicalUrlHash,
          title: parsed.data.title,
          description: parsed.data.description,
          status: "PENDING",
        })
        .onConflictDoNothing({ target: listings.canonicalUrlHash })
        .returning({ id: listings.id });
    }

    if (!listing) {
      [listing] = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.canonicalUrlHash, canonicalUrlHash))
        .limit(1);
    }
    if (!listing) throw new Error("Could not create listing");

    let [intent] = await db
      .select()
      .from(checkoutIntents)
      .where(eq(checkoutIntents.idempotencyKey, idempotencyKey))
      .limit(1);

    if (!intent) {
      [intent] = await db
        .insert(checkoutIntents)
        .values({
          listingId: listing.id,
          idempotencyKey,
          amountMinor,
          proposedTitle: parsed.data.title,
          proposedDescription: parsed.data.description,
          requesterFingerprintHash: requesterHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        })
        .onConflictDoNothing({ target: checkoutIntents.idempotencyKey })
        .returning();
    }

    if (!intent) {
      [intent] = await db
        .select()
        .from(checkoutIntents)
        .where(eq(checkoutIntents.idempotencyKey, idempotencyKey))
        .limit(1);
    }
    if (!intent) throw new Error("Could not create checkout intent");
    if (intent.stripeCheckoutUrl) {
      return NextResponse.json({ url: intent.stripeCheckoutUrl, reused: true });
    }

    const productId = process.env.STRIPE_PRODUCT_ID;
    if (!productId) throw new Error("STRIPE_PRODUCT_ID is not configured");
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              product: productId,
              unit_amount: Number(intent.amountMinor),
            },
          },
        ],
        client_reference_id: intent.id,
        metadata: { intentId: intent.id },
        success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/?checkout=cancelled`,
        expires_at: Math.floor(intent.expiresAt.getTime() / 1000),
      },
      { idempotencyKey: `checkout:${intent.id}` },
    );

    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    await db
      .update(checkoutIntents)
      .set({
        stripeCheckoutSessionId: session.id,
        stripeCheckoutUrl: session.url,
      })
      .where(eq(checkoutIntents.id, intent.id));

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
