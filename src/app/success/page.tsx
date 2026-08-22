import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false, noarchive: true },
};
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";
    } catch {
      paid = false;
    }
  }

  return (
    <main className="status-page">
      <BrandMark />
      <p className="eyebrow"><span /> {paid ? "Payment confirmed" : "Payment processing"}</p>
      <h1>{paid ? "Your bid is on the move." : "Stripe is still confirming the payment."}</h1>
      <p>{paid ? "The signed webhook applies the total exactly once. The board may take a few seconds to refresh." : "You can safely return to the board. Delayed payment methods update automatically after confirmation."}</p>
      <Link href="/">Return to the leaderboard <span>↗</span></Link>
    </main>
  );
}
