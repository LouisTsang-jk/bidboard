import Image from "next/image";
import Link from "next/link";

import { BidForm } from "@/components/bid-form";
import { BrandMark } from "@/components/brand-mark";
import { LeaderboardRow } from "@/components/leaderboard-row";
import { getLeaderboard } from "@/lib/leaderboard";
import { formatUsdMinor } from "@/lib/money";

export const revalidate = 10;

export default async function HomePage() {
  const listings = await getLeaderboard();
  const topBid = BigInt(listings[0]?.totalAmountMinor ?? 0);
  const claimFirst = topBid > 0n ? topBid + 100n : 500n;

  return (
    <main>
      <div className="ticker" aria-label="Live board status">
        <div className="ticker__track">
          {[0, 1].map((copy) => (
            <div className="ticker__set" aria-hidden={copy === 1} key={copy}>
              <span>THE OPEN BIDBOARD</span>
              <span>{listings.length} POSITIONS ACTIVE</span>
              <span>MINIMUM BID $5</span>
              <span>RANKING UPDATES AFTER PAYMENT</span>
            </div>
          ))}
        </div>
      </div>

      <header className="site-header shell">
        <Link className="brand" href="/" aria-label="outbid.website home">
          <BrandMark />
          <span>OUTBID.WEBSITE</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="#leaderboard">Leaderboard</Link>
          <Link href="/about">About</Link>
          <Link href="/rules">Rules</Link>
        </nav>
        <a className="header-cta" href="#place-a-bid">Place a bid</a>
      </header>

      <section className="hero shell" id="place-a-bid">
        <Image
          className="hero__image"
          src="/brand/hero-auction-tape.png"
          alt="Perforated auction tickets rising like a leaderboard"
          fill
          priority
          sizes="(max-width: 800px) 100vw, 58vw"
        />
        <div className="hero__wash" />
        <div className="hero__copy">
          <p className="eyebrow"><span /> The open bidboard</p>
          <h1>Claim #1.<br /><em>{formatUsdMinor(claimFirst)} takes it.</em></h1>
          <p className="hero__lede">
            New spots start at $5. A smaller payment still lands wherever its cumulative
            total can take it. Already listed? Use the same URL to add another bid.
          </p>
          <div className="hero__price"><span>Current #1</span><strong>{formatUsdMinor(topBid)}</strong></div>
        </div>
        <div className="activity-rail" aria-label="Latest board activity">
          <p className="rail-label">LIVE MOVES</p>
          {listings.slice(0, 3).map((listing, index) => (
            <div className="activity-item" key={listing.id}>
              <span>0{index + 1}</span>
              <div><strong>{listing.title}</strong><small>{formatUsdMinor(listing.totalAmountMinor)}</small></div>
            </div>
          ))}
          <p className="rail-note">Paid totals are permanent. Rank is not.</p>
        </div>
        <BidForm suggestedAmount={Number(claimFirst) / 100} />
      </section>

      <section className="board shell" id="leaderboard">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> Live ranking</p><h2>Where the bids stand</h2></div>
          <p>Ranked by cumulative confirmed payments. Equal totals keep the earlier position.</p>
        </div>
        <div className="board__labels" aria-hidden="true"><span>Rank / project</span><span>Signal</span><span>Paid total</span></div>
        <div className="board__rows">
          {listings.map((listing, index) => (
            <LeaderboardRow item={listing} key={listing.id} rank={index + 1} leaderAmount={topBid} />
          ))}
        </div>
      </section>

      <section className="how shell">
        <p className="eyebrow"><span /> How it works</p>
        <div className="how__grid">
          <div><strong>01</strong><h3>Name your position</h3><p>Submit a public URL, a clear description, and any bid from $5.</p></div>
          <div><strong>02</strong><h3>Pay on Stripe</h3><p>Checkout is hosted by Stripe. Card details never touch this site.</p></div>
          <div><strong>03</strong><h3>Move in public</h3><p>Your confirmed payment adds to the project total and the ranking updates.</p></div>
        </div>
      </section>

      <footer className="footer shell">
        <div><BrandMark /><p>Mechanism <a href="https://outbid.lol/" rel="noopener">inspired by outbid.lol</a>.<br />Built independently for outbid.website.</p></div>
        <div className="footer__links"><Link href="/about">About</Link><Link href="/rules">Rules</Link><a href="mailto:hello@outbid.website">Contact</a></div>
      </footer>
      <a className="mobile-bid" href="#place-a-bid">Place a bid · from $5</a>
    </main>
  );
}
