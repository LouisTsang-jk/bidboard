import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

const description =
  "The bidding, ranking, payment, tie-breaking, and listing rules for the outbid.website open bidboard.";

export const metadata: Metadata = {
  title: "Rules",
  description,
  alternates: { canonical: "/rules" },
  openGraph: {
    type: "website",
    url: "/rules",
    siteName: "outbid.website",
    locale: "en_US",
    title: "Rules for the outbid.website bidboard",
    description,
    images: [
      {
        url: "/brand/og-auction-tape.png",
        width: 1200,
        height: 630,
        alt: "outbid.website open bidboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rules for the outbid.website bidboard",
    description,
    images: ["/brand/og-auction-tape.png"],
  },
};

export default function RulesPage() {
  return (
    <main className="text-page">
      <header className="text-page__header">
        <Link className="brand" href="/"><BrandMark /><span>OUTBID.WEBSITE</span></Link>
        <Link href="/">Back to the board</Link>
      </header>
      <article>
        <p className="eyebrow"><span /> Rules</p>
        <h1>Clear money. Clear rank.</h1>
        <ol className="rules-list">
          <li><strong>Minimum bid: $1.</strong><span>All amounts are one-time payments in USD.</span></li>
          <li><strong>Bids accumulate.</strong><span>Paying again for the same normalized URL adds to its confirmed total.</span></li>
          <li><strong>Higher total ranks first.</strong><span>Equal totals keep the earlier first-paid position.</span></li>
          <li><strong>No position is reserved.</strong><span>The board can move between opening Checkout and payment confirmation.</span></li>
          <li><strong>Payment confirms placement.</strong><span>Submitting the form alone does not publish or update a listing.</span></li>
          <li><strong>Sponsored outbound links.</strong><span>Listing links are marked sponsored and clicks are counted with privacy-preserving hashes.</span></li>
          <li><strong>Unsafe or deceptive listings can be hidden.</strong><span>Malware, impersonation, hate, illegal content, and misleading claims are not accepted.</span></li>
        </ol>
        <p className="rule-note">Mechanism <a href="https://outbid.lol/">inspired by outbid.lol</a>. Built independently.</p>
      </article>
    </main>
  );
}
