# Portify architecture

## Runtime boundaries

- **Frontend:** React, TypeScript, Vite, and Tailwind CSS. It is a static Vercel deployment and calls the API with relative `/api` requests in local development or `VITE_API_BASE_URL` in production.
- **API:** `workers/api/src/index.ts` is a Cloudflare Worker. It owns authentication, input validation, authorization, rate limiting, integrations, and JSON responses.
- **Database:** Cloudflare D1 stores users, sessions, profiles, usernames, portfolio content, comments, reactions, contact messages, settings, analytics events, and durable rate-limit buckets.
- **Optional services:** GitHub and Nominatim are called by the Worker with bounded, validated requests. Resend is optional and is required before password-reset requests can be sent. R2, KV, Queues, and Durable Objects are intentionally not bound because the current product has no file-processing, cache-consistency, or asynchronous workload that requires them.

## Authentication and authorization

The Worker stores only PBKDF2 password hashes and SHA-256 hashes of random session/reset tokens. Session tokens are issued in `HttpOnly` cookies; access tokens are never returned to browser JavaScript. Mutating browser requests must come from an origin listed in `ALLOWED_ORIGINS`.

The generic `/data/:table` adapter has an allowlist for tables and columns. Ownership is applied on the server for user-owned rows, and public reads are filtered to public/published content. Admin-only resources are checked again in the Worker. The profile public projection omits email and phone. The first-admin bootstrap requires a deployment secret and refuses to run after an administrator exists.

## Data lifecycle

Migrations are additive and live in `workers/api/migrations`. `0001_initial.sql` creates the relational schema and indexes, `0003_portfolio_themes.sql` adds per-portfolio presentation settings, `0004_rate_limits.sql` adds durable abuse-control buckets, `0005_remove_placeholder_seed.sql` removes rows from the former illustrative seed if it was ever applied, and `0006_admin_bootstrap_lock.sql` protects first-admin provisioning from races. `0002_starter_content.sql` is intentionally empty for new installations; production data must be entered through the authenticated workspace.

Do not edit an already-applied migration. Add a new numbered migration for a schema change, take a D1 backup before a production migration, and verify the result with `wrangler d1 migrations list` and targeted SQL checks.

## Public portfolio flow

A username route resolves to a user ID through `usernames`, then loads the public profile, public projects, skills, experience, and the user's validated `portfolio_themes` record. All data is fetched from the Worker. Missing data is rendered as an honest empty state; request failures are not silently treated as empty content.

## Deployment shape

Vercel serves the static frontend. The frontend's `VITE_API_BASE_URL` must point to the HTTPS Worker URL (including `/api` only once). The Worker is deployed with Wrangler and a D1 binding. The Worker `ALLOWED_ORIGINS` must contain the exact Vercel production origin and any configured preview origins. Secrets such as `ADMIN_BOOTSTRAP_TOKEN`, `RESEND_API_KEY`, `GITHUB_TOKEN`, and `SESSION_COOKIE_DOMAIN` are set with `wrangler secret put`, never committed.
