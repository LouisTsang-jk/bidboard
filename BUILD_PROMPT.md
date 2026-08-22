# Build Prompt

Build and launch a production-ready web application called **Bidboard** at **https://outbid.website**.

Bidboard is a transparent paid leaderboard for websites, products, and internet projects. Study the public behavior and information architecture of https://outbid.lol/ to understand the core concept, but implement everything independently. Do not copy its source code, markup, written copy, images, logo, or exact visual identity.

The finished website must visibly include the credit **“Inspired by outbid.lol”** with a working link to https://outbid.lol/. Put this attribution where ordinary visitors can clearly see it, including the homepage footer and About section.

Work autonomously from initial research through production deployment. Make reasonable implementation decisions without repeatedly asking for clarification. Before creating public or potentially billable external resources, prepare everything and request one concise confirmation covering the exact GitHub repository visibility, Stripe mode, Railway resources, and DNS changes. After approval, complete the remaining actions without unnecessary pauses.

## Core product

Create a paid leaderboard with:

- A homepage showing ranked website or product listings.
- Rank, name, destination URL, original or safely retrieved visual identity, short description, current cumulative paid total, and click count for every listing.
- Ranking by confirmed cumulative payment amount, highest first. Equal amounts keep the earlier qualifying position.
- A clear “Place a bid” call to action.
- A submission flow collecting destination URL, display name, short description, and bid amount.
- Server-side URL normalization and validation.
- Stripe-hosted Checkout for one-time payments.
- A server-verified success page.
- Signed Stripe webhook processing that activates or updates a listing only after confirmed payment.
- A transparent explanation of ranking, cumulative bids, sponsored links, and non-reserved positions.
- Responsive, keyboard-accessible mobile and desktop behavior.
- Useful empty, loading, error, expired-checkout, and payment-processing states.
- Basic operator endpoints for hiding abusive listings and rebuilding the leaderboard cache.

## Original design and imagery

Create a distinctive visual identity that feels editorial, competitive, tactile, and internet-native, without imitating outbid.lol’s exact appearance. Develop an original art direction, typography system, OKLCH color palette, spacing system, motion language, and component style. Avoid generic startup templates, card-heavy dashboards, default fonts, stock photography, copied screenshots, and externally sourced promotional images.

Analyze the imagery the product needs and generate every raster illustration, texture, background, social preview, or decorative image with an image-generation tool. Do not use image search or third-party stock assets. Code-native icons, CSS effects, and original SVG marks are allowed. Save the generation prompts and final asset paths in the build log.

Include:

- An original code-native wordmark or mark.
- A generated hero/editorial background visual.
- A generated Open Graph social preview image.
- Original favicons and application icons.
- Reduced-motion support, visible focus states, semantic HTML, sufficient contrast, and keyboard navigation.

## Technical stack

Use:

- Next.js App Router with TypeScript and React Server Components by default.
- PostgreSQL as the only durable source of truth.
- Drizzle ORM with versioned migrations.
- Redis for hot leaderboard caching, rate limiting, distributed single-flight locks, stale fallback data, and buffered counters.
- Stripe Checkout Sessions and signed webhooks.
- Railway for the web service, worker, PostgreSQL, and Redis.
- A new GitHub repository named `bidboard`, unless a different name is approved at the external-action confirmation.

Keep secrets exclusively in environment variables. Commit an `.env.example`, but never commit credentials, Stripe secrets, webhook secrets, database URLs, Redis URLs, or admin tokens.

## Payment and consistency guarantees

Create one Stripe product named **“Bidboard Placement”**. Use that reusable Product with dynamic one-time `price_data`; do not create a permanent Product or Price for every bid.

Implement these guarantees:

- Verify the raw Stripe webhook body and signature before trusting the event.
- Store every Stripe event ID with a unique constraint.
- Store unique relationships between checkout intent, Checkout Session, PaymentIntent, payment, listing, and contribution.
- Process duplicate, delayed, and out-of-order webhook deliveries safely.
- Use integer minor units for all money. Never use floating point.
- Create Checkout Sessions server-side with Stripe idempotency keys.
- Never trust amounts, listing IDs, URLs, or metadata supplied by the browser or returned without comparison to the local checkout intent.
- Atomically increment a listing’s cumulative total in the same database transaction that records the payment and outbox event.
- Update or invalidate Redis only after the database transaction commits.
- Return success for events that were already applied.
- Never store or process raw card details.

## Scalability and caching

Design for traffic bursts and concurrent payment webhooks:

- PostgreSQL remains authoritative; Redis is disposable and rebuildable.
- Use composite indexes matching rank, contribution history, expiry, and outbox queries.
- Cache the top leaderboard as versioned JSON for 10–20 seconds with randomized TTL jitter.
- Keep a stale copy for 2–5 minutes and serve it during Redis or database slowness.
- Prevent cache stampedes with a short Redis `SET NX PX` single-flight lock.
- Send public cache headers equivalent to `s-maxage=10, stale-while-revalidate=60` where the deployment edge supports them.
- Invalidate and prewarm after a successful bid through a transactional outbox and worker.
- Buffer click counters in Redis and aggregate them to PostgreSQL periodically instead of writing once per click.
- Deduplicate click estimates with short-lived HMAC hashes; never retain raw visitor IP addresses.
- Rate-limit checkout creation, click counting, cache operations, and operator endpoints with shared Redis state.
- Set a small per-instance PostgreSQL pool limit suitable for Railway horizontal scaling.
- Provide process health and dependency readiness endpoints.
- Use structured logs, external-request timeouts, bounded retries, graceful shutdown, and safe database fallbacks.
- If submitted URLs are ever fetched for metadata, block private, loopback, link-local, metadata-service, and reserved destinations; validate every redirect and limit time, MIME type, and response size.
- Never cache Checkout Sessions, operator responses, secrets, or customer-specific payment status.

## Repository quality

Create:

- A concise README covering architecture, local setup, variables, Stripe webhook setup, Railway deployment, caching, and recovery.
- Drizzle schema and migrations.
- Development-only seed data.
- Unit tests for money, ranking, URL normalization, and webhook idempotency behavior.
- Integration coverage for duplicate webhook delivery, concurrent bids, Redis failure, and cache rebuilding when infrastructure is available.
- A lightweight load-test script for leaderboard reads and health checks without generating real charges.
- Lint, type-check, tests, production build, CI, a license, and acknowledgements.

## Process documentation and screenshots

Record the exact start time before implementation and the exact end time only after the production smoke test passes. Use ISO 8601 timestamps with timezone and calculate elapsed duration.

Maintain:

- `docs/build-log/timeline.md`
- `docs/build-log/decisions.md`
- `docs/build-log/image-prompts.md`
- `docs/build-log/screenshots/`

Use ChatGPT in Chrome with the user’s existing logged-in sessions to operate GitHub, Stripe, and Railway. Take screenshots at meaningful milestones:

1. Initial public reference inspection.
2. Original design direction.
3. Generated image previews and selected assets.
4. Locally running homepage.
5. Submission and Checkout flow.
6. Passing tests and load-test result.
7. Prepared GitHub repository creation screen.
8. Created Stripe product and webhook.
9. Railway project and first successful deployment.
10. Final live homepage and production smoke test at https://outbid.website.

Use chronological filenames. Add each screenshot to the timeline with timestamp and a one-sentence description. Never capture API keys, passwords, card details, customer information, recovery codes, private environment variables, or other secrets.

## External setup

Using ChatGPT in Chrome:

- Create the GitHub repository, push the completed default branch, and verify CI.
- Create the “Bidboard Placement” Stripe product in the approved mode.
- Configure the production Stripe webhook and required Checkout events.
- Create the Railway project and provision web, worker, PostgreSQL, and Redis services.
- Configure secrets through Railway’s variable interface.
- Deploy from GitHub and run Drizzle migrations as a release command.
- Configure `outbid.website` as the custom domain, apply the exact required DNS record, and verify HTTPS.
- Verify restart behavior, health checks, logs, database connectivity, Redis connectivity, and webhook delivery.

## Completion gate

Do not declare completion until:

- `https://outbid.website` loads with valid HTTPS.
- The visible `Inspired by outbid.lol` attribution works.
- The design and all imagery are original.
- Mobile, desktop, keyboard navigation, contrast, and reduced motion are verified.
- A Stripe Checkout Session is created in the approved mode.
- A signed successful-payment webhook updates the listing exactly once.
- Duplicate and concurrent webhook tests do not duplicate revenue or corrupt ranking.
- Redis can be cleared and rebuilt from PostgreSQL.
- A stale readable leaderboard remains available during a controlled cache failure.
- Rate limits, lint, type checking, tests, production build, GitHub CI, and Railway health checks pass.
- No secrets exist in Git history, screenshots, build logs, or documentation.
- The build log contains exact start time, end time, elapsed duration, and final screenshots.

Finish with a concise report containing the live URL, repository URL, Stripe product and mode, Railway service summary, tests, load-test result, cache strategy, screenshot directory, start time, end time, elapsed duration, and any remaining manual account or DNS action.
