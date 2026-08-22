import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getDb } from "@/db/client";
import {
  checkoutIntents,
  contributions,
  listings,
  payments,
  stripeEvents,
} from "@/db/schema";
import { invalidateLeaderboard } from "@/lib/leaderboard";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  if (!session.payment_intent) return null;
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, pending: true });
  }

  try {
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const insertedEvent = await tx
        .insert(stripeEvents)
        .values({ eventId: event.id, type: event.type })
        .onConflictDoNothing({ target: stripeEvents.eventId })
        .returning({ eventId: stripeEvents.eventId });
      if (insertedEvent.length === 0) return "duplicate-event";

      const intentId = session.metadata?.intentId;
      if (!intentId) throw new Error("MISSING_INTENT_ID");
      const [intent] = await tx
        .select()
        .from(checkoutIntents)
        .where(eq(checkoutIntents.id, intentId))
        .limit(1);
      if (!intent) throw new Error("INTENT_NOT_FOUND");
      if (session.id !== intent.stripeCheckoutSessionId) throw new Error("SESSION_MISMATCH");
      if (BigInt(session.amount_total ?? -1) !== intent.amountMinor) throw new Error("AMOUNT_MISMATCH");
      if ((session.currency ?? "").toLowerCase() !== intent.currency) throw new Error("CURRENCY_MISMATCH");

      const insertedPayment = await tx
        .insert(payments)
        .values({
          intentId: intent.id,
          checkoutSessionId: session.id,
          paymentIntentId: paymentIntentId(session),
          amountMinor: intent.amountMinor,
          currency: intent.currency,
          status: "PAID",
          paidAt: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000),
        })
        .onConflictDoNothing({ target: payments.intentId })
        .returning({ id: payments.id });

      if (insertedPayment.length === 0) {
        await tx
          .update(stripeEvents)
          .set({ processedAt: new Date() })
          .where(eq(stripeEvents.eventId, event.id));
        return "duplicate-payment";
      }

      const [updated] = await tx
        .update(listings)
        .set({
          title: intent.proposedTitle,
          description: intent.proposedDescription,
          status: "ACTIVE",
          totalAmountMinor: sql`${listings.totalAmountMinor} + ${intent.amountMinor}`,
          firstPaidAt: sql`coalesce(${listings.firstPaidAt}, now())`,
          lastPaidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(listings.id, intent.listingId))
        .returning({ totalAmountMinor: listings.totalAmountMinor });
      if (!updated) throw new Error("LISTING_NOT_FOUND");

      await tx.insert(contributions).values({
        listingId: intent.listingId,
        paymentId: insertedPayment[0].id,
        amountMinor: intent.amountMinor,
        runningTotalMinor: updated.totalAmountMinor,
      });
      await tx
        .update(checkoutIntents)
        .set({ status: "PAID" })
        .where(eq(checkoutIntents.id, intent.id));
      await tx
        .update(stripeEvents)
        .set({ processedAt: new Date() })
        .where(eq(stripeEvents.eventId, event.id));
      return "applied";
    });

    if (result === "applied") await invalidateLeaderboard();
    return NextResponse.json({ received: true, result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "WEBHOOK_PROCESSING_FAILED";
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
