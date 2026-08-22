import type { LeaderboardItem } from "@/lib/leaderboard";
import { formatUsdMinor } from "@/lib/money";

function initial(title: string): string {
  return title.trim().charAt(0).toUpperCase();
}

export function LeaderboardRow({ item, rank, leaderAmount }: { item: LeaderboardItem; rank: number; leaderAmount: bigint }) {
  const amount = BigInt(item.totalAmountMinor);
  const signal = leaderAmount > 0n ? Math.max(4, Number((amount * 100n) / leaderAmount)) : 4;
  const href = item.id.startsWith("demo-") ? item.canonicalUrl : `/api/go/${item.slug}`;

  return (
    <article className={`ranking-row ${rank <= 3 ? "ranking-row--top" : ""}`}>
      <a href={href} rel="sponsored noopener" target="_blank" aria-label={`Visit ${item.title}`}>
        <span className="rank-number">{String(rank).padStart(2, "0")}</span>
        <span className="project-mark">{initial(item.title)}</span>
        <span className="project-copy"><strong>{item.title}</strong><small>{new URL(item.canonicalUrl).hostname.replace(/^www\./, "")}</small><p>{item.description}</p></span>
        <span className="signal"><i style={{ width: `${signal}%` }} /><small>{Number(item.clickCount).toLocaleString()} clicks</small></span>
        <span className="row-amount"><strong>{formatUsdMinor(amount)}</strong><small>confirmed</small></span>
        <span className="row-arrow" aria-hidden="true">↗</span>
      </a>
      <a className="raise-link" href="#place-a-bid">Add a bid</a>
    </article>
  );
}
