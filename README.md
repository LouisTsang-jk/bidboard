# outbid.website

A transparent paid leaderboard for internet projects. Confirmed one-time Stripe payments accumulate on a project, and the public board ranks the highest total first. Equal totals keep the earlier position.

Mechanism [inspired by outbid.lol](https://outbid.lol/). Design, code, copy, and imagery are independent.

## Architecture

```text
Browser → Railway web (Next.js)
              ├── PostgreSQL: listings, checkout intents, payments, events, outbox
              ├── Redis: hot/stale leaderboard, rate limits, buffered clicks
              └── Stripe Checkout
                       └── signed webhook → PostgreSQL transaction → outbox

Railway worker → outbox processing, cache invalidation, click aggregation
```

- PostgreSQL is the only durable authority.
- Redis uses a 10–20 second jittered hot cache, five-minute stale fallback, and a short single-flight rebuild lock.
- The payment transaction uniquely records the Stripe event, local intent, payment, and contribution before atomically incrementing the listing total.
- Stripe Checkout uses one reusable `Bidboard Placement` Product with dynamic one-time pricing.
- Clicks are buffered in Redis and visitor estimates use hourly HMAC values; raw IP addresses are not retained.

## Local setup

Requirements: Node.js 22+, pnpm 10+, PostgreSQL, and Redis.

```bash
cp .env.example .env.local
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Without `DATABASE_URL` and `REDIS_URL`, the homepage deliberately renders a read-only demo board; payment and tracked redirects stay disabled.

Run the worker separately with `pnpm worker`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Canonical public origin, `https://outbid.website` in production |
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `REDIS_URL` | Railway Redis connection string |
| `DATABASE_POOL_MAX` | Maximum connections per web instance; default `8` |
| `STRIPE_SECRET_KEY` | Stripe secret key for the approved mode |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe/webhook` |
| `STRIPE_PRODUCT_ID` | Reusable `Bidboard Placement` Product ID |
| `ADMIN_TOKEN` | Bearer token for operator endpoints |
| `VISITOR_HASH_SECRET` | Rotatable secret for privacy-preserving click hashes |
| `WORKER_POLL_MS` | Outbox worker interval; default `5000` |

Never commit real values. Railway variables should reference the provisioned PostgreSQL and Redis services.

## Stripe setup

1. Create one Product named `Bidboard Placement` in the approved Stripe mode.
2. Put its Product ID in `STRIPE_PRODUCT_ID`.
3. Add `https://outbid.website/api/stripe/webhook` as a webhook endpoint.
4. Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
5. Store its signing secret in `STRIPE_WEBHOOK_SECRET`.

Checkout Sessions use server-side `price_data`, dynamic payment methods, a stable Stripe idempotency key, and Stripe-hosted payment pages. Raw card details never reach the application.

## Database and recovery

Generate and apply Drizzle migrations with `pnpm db:generate` and `pnpm db:migrate`.

The cache is disposable. Rebuild it with:

```bash
curl -X POST https://outbid.website/api/admin/cache/rebuild \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

If Redis fails, leaderboard reads fall back to PostgreSQL or the stale cache. Payment correctness never depends on Redis. Failed outbox work remains unprocessed for retry.

## Operator endpoints

- `POST /api/admin/cache/rebuild`
- `POST /api/admin/listings/:id/hide`

Both require `Authorization: Bearer <ADMIN_TOKEN>` and must not be exposed through cached proxies.

## Railway deployment

Provision one Railway project with:

- `web`: build `pnpm build`, start `pnpm start`, health check `/api/health`
- `worker`: build `pnpm install --frozen-lockfile`, start `pnpm worker`
- PostgreSQL
- Redis

Set a release or pre-deploy command of `pnpm db:migrate` on the web service. Keep the web service stateless and scale horizontally only after checking the aggregate PostgreSQL pool size. The worker can remain one replica; its database outbox is retryable.

Add `outbid.website` to the web service, then apply Railway’s exact DNS record at the domain provider. Keep the Railway-generated domain available for the Stripe webhook until custom-domain HTTPS is verified.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm loadtest
```

The load test defaults to 500 read-only requests at concurrency 50 and never creates a charge.

## Build record

- Public execution prompt: [BUILD_PROMPT.md](./BUILD_PROMPT.md)
- Timeline: [docs/build-log/timeline.md](./docs/build-log/timeline.md)
- Decisions: [docs/build-log/decisions.md](./docs/build-log/decisions.md)
- Image prompts: [docs/build-log/image-prompts.md](./docs/build-log/image-prompts.md)

## License

MIT. See [LICENSE](./LICENSE).
