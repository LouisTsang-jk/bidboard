import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="text-page">
      <header className="text-page__header">
        <Link className="brand" href="/"><BrandMark /><span>OUTBID.WEBSITE</span></Link>
        <Link href="/">Back to the board</Link>
      </header>
      <article>
        <p className="eyebrow"><span /> About</p>
        <h1>A public market for attention.</h1>
        <p className="intro">outbid.website is a deliberately simple experiment: projects pay once, the confirmed amount becomes public, and the leaderboard sorts itself.</p>
        <h2>The mechanism</h2>
        <p>A bid is an addition, not a reservation. Your payment permanently increases the project’s public total. A higher competing total can move ahead at any time.</p>
        <h2>Independent build</h2>
        <p>The mechanism was <a href="https://outbid.lol/">inspired by outbid.lol</a>. This implementation, brand, code, copy, and imagery were created independently for outbid.website.</p>
        <h2>Why transparent?</h2>
        <p>Every visitor sees the same rank and the same confirmed totals. There are no private boosts, hidden quality scores, or subscription tiers affecting position.</p>
      </article>
    </main>
  );
}
