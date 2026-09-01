# Deployment runbook

## Prerequisites

- Node.js 20.19+ (Node 22 LTS is recommended for the current Vite toolchain).
- A Cloudflare account with Workers and D1 enabled.
- A Vercel project connected to this repository.
- A verified sender/domain if password-reset email is enabled.

## Local development

```sh
npm ci
npx wrangler d1 migrations apply portify-db --local
npx wrangler dev --local --ip 0.0.0.0 --port 8787
# in another terminal
npm run dev
```

The Vite server proxies `/api` to `http://127.0.0.1:8787` by default. Set `VITE_API_PROXY_TARGET` when the local Worker uses another port. Do not add provider credentials to `.env`; use `.env.example` as the template.

## Provision Cloudflare

1. Create a D1 database: `npx wrangler d1 create portify-db`.
2. Replace the placeholder `database_id` in `wrangler.toml` with the returned ID. Keep the binding name `DB`.
3. Set production variables in the Cloudflare dashboard or Wrangler environment configuration:
   - `ENVIRONMENT=production`
   - `ALLOWED_ORIGINS=https://your-vercel-domain.example`
   - `APP_URL=https://your-vercel-domain.example`
   - `MAIL_FROM=Portify <verified-sender@example>` when using Resend
4. Set secrets without writing them to git:

```sh
npx wrangler secret put ADMIN_BOOTSTRAP_TOKEN --env production
npx wrangler secret put RESEND_API_KEY --env production       # optional, required for reset email
npx wrangler secret put GITHUB_TOKEN --env production         # optional; improves GitHub API limits
npx wrangler secret put SESSION_COOKIE_DOMAIN --env production # optional; only for an intentional shared parent domain
```

5. Back up the database, then apply migrations remotely:

```sh
npx wrangler d1 backup create portify-db --env production
npx wrangler d1 migrations list portify-db --remote --env production
npx wrangler d1 migrations apply portify-db --remote --env production
npx wrangler deploy --env production
```

The first administrator is provisioned once by sending `POST /admin/bootstrap` with the `X-Admin-Bootstrap-Token` header and a strong password. Remove/rotate the bootstrap secret after provisioning and keep the endpoint disabled by unsetting it when no longer needed.

## Provision Vercel

1. Import the repository as a Vite project.
2. Use `npm ci` for install and `npm run build` for the build command. The output directory is `dist` (also declared in `vercel.json`).
3. Set the production environment variable:

```text
VITE_API_BASE_URL=https://your-worker.example.workers.dev
```

The API base may end in `/api`; the client normalizes that suffix. Redeploy after setting it. The Vercel security headers and SPA fallback are defined in `vercel.json`.

## Verification checklist

- `npm run lint`
- `npx tsc --noEmit -p tsconfig.app.json`
- `npx tsc --noEmit --types @cloudflare/workers-types --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck workers/api/src/index.ts`
- `npm run build`
- `npx wrangler d1 migrations list portify-db --local`
- `curl https://your-worker.example/health`
- Test registration, login, logout, profile ownership, username collision, public/private content, password reset configuration, contact submission, and admin role changes in a non-production database.

## Operations

Monitor Worker error logs using `wrangler tail`. The scheduled Worker handler removes expired durable rate-limit buckets every 15 minutes. Rotate the bootstrap, mail, and GitHub secrets if they are ever exposed. Never log passwords, session tokens, reset tokens, or message contents.
