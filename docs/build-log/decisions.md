# Build decisions

## Product semantics

Each confirmed payment permanently adds to a normalized URL’s cumulative total. Checkout does not reserve a rank. This avoids high-concurrency reservation races and makes delayed payment methods safe.

The enforced minimum is USD 1. When the board is empty, the suggested opening amount is USD 1; otherwise the claim-first suggestion is the current leader plus USD 1. Smaller accepted bids can still enter below the leader based on their cumulative total.

## Bid form comprehension

The homepage uses a conventional two-step bid flow instead of presenting four compressed fields as a data console. Step 1 asks only for the website URL and a clearly separated amount choice: USD 1 minimum, the current-leader-plus-USD-1 `Take #1` amount, or a custom amount. USD 1 is the default and the `Take #1` figure is a current-board calculation, not a reserved rank. Step 2 shows the chosen URL and exact payment amount before asking for the public project name and description; the final button names Stripe and repeats the charge amount.

Input text is at least 16px, labels are 13px, controls have visible boundaries, and primary targets are at least 48px high. The former fixed mobile bid bar was removed because it covered the form it linked to. Checkout is still created only after Step 2. An unchanged failed submission reuses its idempotency key, while editing the draft resets the key; the API rejects reuse with conflicting bid details.

## Payment consistency

The local checkout intent is created before Stripe. Stripe receives only the intent ID in metadata and uses a stable idempotency key. The webhook verifies its signature, event ID, session ID, amount, and currency against PostgreSQL. A single transaction inserts the unique event and payment, atomically increments the listing total, and records a contribution. After commit, the same Next.js request invalidates the disposable leaderboard cache.

## Cache strategy

PostgreSQL is authoritative. Redis keeps a versioned JSON leaderboard for 10–20 seconds, a five-minute stale copy, a 1.5-second single-flight lock, shared rate limits, and short-lived click batches. Tracked redirects use Next.js `after()` so analytics do not delay navigation; a per-listing Redis lock coalesces concurrent clicks before one atomic database update. Redis loss falls back to direct click writes and cannot change payment correctness.

## Visual direction

The interface uses an original “Auction Tape” direction: midnight navy, acid chartreuse, and hot orange; condensed editorial type; a horizontal market-tape leaderboard; and code-native ascending-bar marks. This deliberately avoids outbid.lol’s warm-white, coral, rounded-card visual language. Raster imagery was generated specifically for this project.

## Attribution

The homepage footer, About page, Rules page, README, and public build prompt include a visible link crediting outbid.lol as the mechanism inspiration.

## Account isolation

`outbid.website` uses its own United Kingdom Stripe account and sandbox instead of sharing LACUNA.FM's payment account. The test product that was briefly created in the LACUNA.FM sandbox was archived before any transaction occurred. Its Railway Web service uses the project's dedicated PostgreSQL and Redis services.

The independent Sandbox Product keeps one active USD 1 default Price. The former USD 5 Price is archived. Checkout still uses dynamic `price_data` against the reusable Product, so server-validated bid amounts above USD 1 do not create permanent Prices.

## Railway rendering and edge cache

Railway's image build phase cannot resolve another service's private `*.railway.internal` hostname. The public homepage therefore renders dynamically after deployment instead of querying PostgreSQL during `next build`. Redis remains the rebuildable 10–20 second hot cache, while the homepage response advertises `s-maxage=10, stale-while-revalidate=60` and Railway CDN caching is enabled with origin-header and SWR support.
