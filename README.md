# Portify — a cinematic portfolio platform on Cloudflare

Portify is a full-stack portfolio platform for developers: claim a handle, publish
projects, writing and skills, tune the look, and be discovered. The whole product
runs on Cloudflare — a Workers API over D1 (SQL), R2 (media) and KV (GitHub cache),
with a React + Vite front end that talks to it through one REST surface.

## Architecture

| Layer | What runs there |
| --- | --- |
| Front end | React 18, Vite 5, TypeScript, Tailwind, framer-motion, recharts, shadcn/radix |
| API | `worker/src` — a hand-rolled router on Cloudflare Workers (no framework) |
| Data | D1 (`worker/db/schema.sql`, 31 tables) with per-table policies in `worker/src/lib/tables.ts` |
| Media | R2 bucket `MEDIA` via `/api/media/*` (≤6 MB: png/jpeg/webp/gif/avif/svg/pdf) |
| Cache | KV for GitHub repo lookups (15 min) |
| Static | `./dist` served as SPA assets by the Worker, with `/api`, `/sitemap.xml`, `/rss.xml` handled in code |

Every response uses the envelope `{ data, error }`. The front end's
`src/lib/api/client.ts` wraps it in a Supabase-style query builder, so pages read
`db.from('projects').select(...).eq('user_id', id)` and get typed results back.

## Getting started

```sh
npm i
npm run db:migrate:local      # create D1 tables locally
npm run db:seed               # demo users, projects, posts, analytics
npm run dev:all               # Worker on :8787 + Vite on :8080
```

Open http://localhost:8080. Demo accounts: `elias@portify.dev` / `demo1234`
(admin) and any seeded developer with `portfolio123`.

### API surface (high level)

- **Auth** — signup, login, logout, sessions, OAuth (`/api/auth/oauth/:provider`),
  password reset/change, verify email, logout-all
- **Data** — `/api/db/:table` (GET/POST/PATCH/PUT/DELETE) with filters (`f.col=op.value`),
  ordering, limits, `select`, `count=exact`, `embed=`, upserts; policies enforce ownership
- **Profile & app** — `/api/profile`, `/api/profiles/me`, `/api/usernames/*`,
  `/api/portfolio/:username`, `/api/dashboard`, `/api/analytics/me`,
  `/api/community/*`, `/api/activity`, `/api/notifications`, `/api/search`,
  `/api/stats/public`, `/api/account/*`, `/api/onboarding`, `/api/newsletter`
- **Social** — `/api/contact`, `/api/messages/*`, `/api/social/follow/:id`,
  `/api/social/reactions`, `/api/social/endorse/*`, `/api/comments`
- **Media** — `/api/media/upload`, `/api/media/file/*`, list, delete
- **Integrations** — `/api/integrations/github/repos|import|sync|languages/:username`
- **Admin** — stats, users, roles, status, audit, content moderation, health, seed
- **SEO** — `/api/og/:username` (SVG card), `sitemap.xml`, `rss.xml`, `robots.txt`,
  plus per-page titles, descriptions and social cards applied client-side

## Verification

```sh
npm run smoke         # 73 API checks against the running Worker (resets + reseeds D1)
npm run check:render  # renders all 24 routes in jsdom, flags crashes and blank pages
npm run check:flows   # drives 9 user journeys through the real UI in jsdom
npm run typecheck     # app + worker TypeScript projects
npm run build         # production bundle into ./dist
```

`check:flows` covers: email sign-in, contact submission, commenting, reacting,
following and endorsing another developer, direct messaging, the full
sign-up → onboarding → portfolio path, and the testimonial loop
(visitor writes → owner approves).

## Deploying to Cloudflare

```sh
npx wrangler d1 create portify-db          # copy the id into wrangler.toml
npx wrangler r2 bucket create portify-media
npx wrangler d1 execute portify-db --remote --file=./worker/db/schema.sql
npx wrangler secret put SESSION_SECRET     # plus RESEND_API_KEY, GITHUB_* if used
npm run deploy                             # builds ./dist and wrangler deploy
```

Set `ALLOW_DEV_ROUTES` to `"0"` and `RATE_LIMIT_DISABLED` to `"0"` in production
(both are already the defaults in `wrangler.toml`; `.dev.vars` relaxes them locally).

## Design system

`src/index.css` + `tailwind.config.ts` define the cinematic layer: colour tokens
(violet/cyan/amber), easing curves, shadow tiers, `.panel`, `.glass`, `.display-*`,
`.grid-overlay`, `.aurora`, `.noise`, `.sheen`, `.underline-sweep` and prose styles.
Motion primitives live in `src/components/experience/` (Reveal, ScrollProgress,
CursorGlow, TiltCard, Background, CommandSearch) and reusable UI in
`src/components/ui-kit/`.
