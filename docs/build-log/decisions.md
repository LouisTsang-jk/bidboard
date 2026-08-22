# Build decisions

## Product semantics

Each confirmed payment permanently adds to a normalized URL’s cumulative total. Checkout does not reserve a rank. This avoids high-concurrency reservation races and makes delayed payment methods safe.

## Payment consistency

The local checkout intent is created before Stripe. Stripe receives only the intent ID in metadata and uses a stable idempotency key. The webhook verifies its signature, event ID, session ID, amount, and currency against PostgreSQL. A single transaction inserts the unique event and payment, atomically increments the listing total, records a contribution, and writes an outbox event.

## Cache strategy

PostgreSQL is authoritative. Redis keeps a versioned JSON leaderboard for 10–20 seconds, a five-minute stale copy, a 1.5-second single-flight lock, shared rate limits, and buffered clicks. Redis loss can reduce performance or temporarily delay click counts, but cannot change payment correctness.

## Visual direction

The interface uses an original “Auction Tape” direction: midnight navy, acid chartreuse, and hot orange; condensed editorial type; a horizontal market-tape leaderboard; and code-native ascending-bar marks. This deliberately avoids outbid.lol’s warm-white, coral, rounded-card visual language. Raster imagery was generated specifically for this project.

## Attribution

The homepage footer, About page, Rules page, README, and public build prompt include a visible link crediting outbid.lol as the mechanism inspiration.

## Account isolation

`outbid.website` uses its own United Kingdom Stripe account and sandbox instead of sharing LACUNA.FM's payment account. The test product that was briefly created in the LACUNA.FM sandbox was archived before any transaction occurred. The Railway Web and Worker services share source code, database, and Redis, but service-specific commands and health checks are configured independently in Railway.

## Railway rendering and edge cache

Railway's image build phase cannot resolve another service's private `*.railway.internal` hostname. The public homepage therefore renders dynamically after deployment instead of querying PostgreSQL during `next build`. Redis remains the rebuildable 10–20 second hot cache, while the homepage response advertises `s-maxage=10, stale-while-revalidate=60` and Railway CDN caching is enabled with origin-header and SWR support.
