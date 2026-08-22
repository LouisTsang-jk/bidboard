# Build timeline

- **Start:** `2026-08-22T10:50:26+08:00`
- **End:** `2026-08-22T12:35:54+08:00`
- **Elapsed:** `1h 45m 28s`

## Events

| Time (Asia/Singapore) | Milestone | Evidence |
| --- | --- | --- |
| `2026-08-22T10:50:26+08:00` | Began the independent outbid.website implementation and recorded the execution prompt requirements. | This timeline and Git history. |
| `2026-08-22T10:53:48+08:00` | Inspected the public outbid.lol homepage in Chrome to understand the visible mechanism and information hierarchy. | [`01-reference.png`](./screenshots/01-reference.png) |
| `2026-08-22T10:55:55+08:00` | Selected the original “Auction Tape” hero artwork generated for this project. | [`hero-auction-tape.png`](../../public/brand/hero-auction-tape.png) |
| `2026-08-22T11:10:32+08:00` | Prepared the generated social preview artwork at the exact 1200×630 output size. | [`og-auction-tape.png`](../../public/brand/og-auction-tape.png) |
| `2026-08-22T11:12:18+08:00` | Completed the first implementation pass for payment idempotency, ranking cache, click buffering, and the original interface. | Source tree. |
| `2026-08-22T11:17:01+08:00` | Captured the first full-page original interface direction in local production mode. | [`02-local-homepage.png`](./screenshots/02-local-homepage.png) |
| `2026-08-22T11:17:59+08:00` | Re-verified the desktop hero after integrating the generated Auction Tape artwork. | [`03-local-hero.png`](./screenshots/03-local-hero.png) |
| `2026-08-22T11:18:11+08:00` | Verified the responsive mobile layout at a 390×844 viewport and reset the browser viewport afterward. | [`04-mobile-homepage.png`](./screenshots/04-mobile-homepage.png) |
| `2026-08-22T11:19:28+08:00` | Completed a 500-request local production load check at concurrency 50: 500 succeeded, p95 64 ms, p99 66 ms. | [`load-test.json`](./load-test.json) |
| `2026-08-22T11:21:03+08:00` | Prepared a public `LouisTsang-jk/bidboard` GitHub repository form without submitting it. | [`05-github-prepared.png`](./screenshots/05-github-prepared.png) |
| `2026-08-22T11:23:02+08:00` | Prepared a Stripe test-mode one-time USD 5 default price without saving it. | [`06-stripe-price-prepared.png`](./screenshots/06-stripe-price-prepared.png) |
| `2026-08-22T11:23:08+08:00` | Prepared the `Bidboard Placement` Stripe test product without saving it. | [`07-stripe-product-prepared.png`](./screenshots/07-stripe-product-prepared.png) |
| `2026-08-22T11:29:37+08:00` | Created the first test product in the wrong LACUNA.FM sandbox, identified the account-isolation error, and archived the product before continuing. It never handled a transaction. | [`08-stripe-product-created.png`](./screenshots/08-stripe-product-created.png) |
| `2026-08-22T11:38:06+08:00` | Created a separate United Kingdom Stripe account and sandbox for `outbid.website`. | [`09-stripe-independent-account.png`](./screenshots/09-stripe-independent-account.png) |
| `2026-08-22T11:39:50+08:00` | Created the correct sandbox `Bidboard Placement` product and USD 5 default price in the independent account. | [`10-stripe-product-correct-account.png`](./screenshots/10-stripe-product-correct-account.png) |
| `2026-08-22T11:52:00+08:00` | Removed shared Railway start and healthcheck settings so Web and Worker could use independent service commands. | Git commit `0da7509`. |
| `2026-08-22T11:57:00+08:00` | The first environment-backed application deploy exposed a build-time private-network lookup: Next.js tried to prerender the database-backed homepage before Railway private DNS was available. Both new images failed without replacing the prior live Web deployment. | Railway build logs. |
| `2026-08-22T11:59:48+08:00` | Moved homepage data access to request time, retained the Redis hot cache, and added `s-maxage=10, stale-while-revalidate=60` for Railway's edge cache. The Railway-like build then passed with intentionally unreachable private-network URLs. | Git commit `5caa008`. |
| `2026-08-22T12:04:33+08:00` | Verified the deployed Railway homepage over HTTPS with the empty production database, original generated artwork, bid form, public rules, and visible outbid.lol attribution. | [`12-railway-preview-homepage.png`](./screenshots/12-railway-preview-homepage.png) |
| `2026-08-22T12:09:52+08:00` | Confirmed the independent `outbid.website` Railway project had Web, Worker, PostgreSQL, and Redis online; the custom domain was prepared and awaiting DNS. | [`11-railway-services.png`](./screenshots/11-railway-services.png) |
| `2026-08-22T12:17:16+08:00` | Lowered the enforced minimum bid from USD 5 to USD 1 across server validation, form constraints, homepage copy, rules, and boundary tests. | Git commit `c2c031c`. |
| `2026-08-22T12:23:27+08:00` | Created a USD 1 one-time Stripe Sandbox price, made it the Product default, and archived the former USD 5 price. | [`13-stripe-one-dollar.png`](./screenshots/13-stripe-one-dollar.png) |
| `2026-08-22T12:32:30+08:00` | Verified that the production site could create a hosted USD 1 Checkout Session in the independent Stripe Sandbox. No real card or real charge was involved. | [`14-stripe-checkout-one-dollar.png`](./screenshots/14-stripe-checkout-one-dollar.png) |
| `2026-08-22T12:33:30+08:00` | Completed a Stripe test-card payment; the signed production Webhook returned HTTP 200 with `result: applied` and published `outbid.website` at a cumulative USD 1. | Stripe Event Delivery and the production leaderboard. |
| `2026-08-22T12:35:00+08:00` | Manually resent the identical Stripe Event; the Webhook returned HTTP 200 with `result: duplicate-event`, while the public total remained USD 1. | [`15-webhook-idempotency.png`](./screenshots/15-webhook-idempotency.png) |
| `2026-08-22T12:35:54+08:00` | Completed the production smoke test at `https://outbid.website`: valid HTTPS, one active position, USD 1 minimum, original artwork, attribution, Railway services, CDN/Redis cache path, Checkout, and Webhook idempotency all verified. | [`16-final-homepage.png`](./screenshots/16-final-homepage.png) |
| `2026-08-22T12:58:14+08:00` | Replaced the compressed single-row bid console with a legible two-step flow: URL and explicit USD 1 / take-first / custom choices first, then public project details and an amount-specific Stripe CTA. Verified desktop, 390px mobile, focus movement, back/forward draft retention, and a USD 1.01 custom amount. | [`17-two-step-bid-form.png`](./screenshots/17-two-step-bid-form.png) |

The end time was recorded only after the production smoke test and duplicate-Webhook verification passed.
