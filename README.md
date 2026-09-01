# Portify

Portify is a developer portfolio workspace. Authenticated users can maintain a profile, username, projects, skills, work experience, articles, theme settings, and a private resume. Public visitors can browse public content, view username portfolios, send contact messages, and use community features.

## Stack

- React + TypeScript + Vite + Tailwind CSS on Vercel
- Cloudflare Workers API
- Cloudflare D1 relational database
- Optional Worker integrations: GitHub, Nominatim, and Resend

The browser does not connect to Supabase or a database directly. The Worker validates input, enforces ownership/admin authorization, handles sessions in `HttpOnly` cookies, and returns only allowlisted data.

## Quick start

```sh
npm ci
npx wrangler d1 migrations apply portify-db --local
npx wrangler dev --local --ip 0.0.0.0 --port 8787
# in a second terminal
npm run dev
```

The Vite development server proxies `/api` to the local Worker. Copy `.env.example` only when a different API target is needed. Never commit secrets or provider credentials.

## Checks

```sh
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit --types @cloudflare/workers-types --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck workers/api/src/index.ts
npm run build
```

## Deployment

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the runtime/data model and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Cloudflare D1/Worker and Vercel setup, secrets, migrations, first-admin provisioning, and verification. `wrangler.toml` contains a placeholder D1 ID that must be replaced with the ID created for the target Cloudflare account.

## Data and migrations

New installations intentionally contain no fabricated portfolio or contact data. Apply migrations in order. Do not rewrite an applied migration; add a new numbered migration and back up D1 before applying it remotely. The former illustrative seed is neutralized for new databases, a targeted cleanup migration removes its known demo rows from databases where it was previously applied, and the admin bootstrap lock migration makes first-admin provisioning race-safe.
