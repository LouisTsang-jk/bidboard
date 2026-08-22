import { getDb } from "../src/db/client";
import { listings } from "../src/db/schema";
import { hashUrl, normalizePublicUrl, slugFromUrl } from "../src/lib/url";

const samples = [
  ["https://example.com/northstar", "Northstar Labs", "Small, sharp tools for ambitious internet teams.", 128_500n],
  ["https://example.com/tiny-signal", "Tiny Signal", "Product analytics that tells you what changed.", 86_000n],
  ["https://example.com/after-dark", "After Dark", "A weekly field guide to unusual software and design.", 42_500n],
] as const;

async function main() {
  for (const [rawUrl, title, description, totalAmountMinor] of samples) {
    const canonicalUrl = normalizePublicUrl(rawUrl);
    await getDb()
      .insert(listings)
      .values({
        slug: slugFromUrl(canonicalUrl),
        canonicalUrl,
        canonicalUrlHash: hashUrl(canonicalUrl),
        title,
        description,
        status: "ACTIVE",
        totalAmountMinor,
        firstPaidAt: new Date("2026-08-20T00:00:00.000Z"),
        lastPaidAt: new Date("2026-08-20T00:00:00.000Z"),
      })
      .onConflictDoNothing({ target: listings.canonicalUrlHash });
  }
  console.info("Development seed complete.");
}

void main();
