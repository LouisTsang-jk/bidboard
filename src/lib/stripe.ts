import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
      appInfo: {
        name: "outbid.website",
        version: "0.1.0",
        url: "https://outbid.website",
      },
      maxNetworkRetries: 2,
      timeout: 10_000,
    });
  }
  return stripeClient;
}
