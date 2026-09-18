/**
 * Portify API — Cloudflare Worker entry point.
 *
 * Serves both the REST API (/api/*) and the compiled single-page app from
 * Workers Assets, so a single `wrangler deploy` ships the whole product.
 */
import type { Env } from './env';
import { Router } from './lib/router';
import { CORS_HEADERS, SECURITY_HEADERS, json } from './lib/http';
import { primeContext } from './lib/context';
import { registerAuthRoutes } from './routes/auth';
import { registerDBRoutes } from './routes/db';
import { registerWorkspaceRoutes } from './routes/workspace';
import { registerSocialRoutes } from './routes/social';
import { registerMediaRoutes } from './routes/media';
import { registerIntegrationRoutes } from './routes/integrations';
import { registerAdminRoutes } from './routes/admin';
import { registerSEORoutes } from './routes/seo';
import { runSeed } from './lib/seed';

const router = new Router<Env>();
registerAuthRoutes(router);
registerDBRoutes(router);
registerWorkspaceRoutes(router);
registerSocialRoutes(router);
registerMediaRoutes(router);
registerIntegrationRoutes(router);
registerAdminRoutes(router);
registerSEORoutes(router);

const DYNAMIC_PREFIXES = ['/api/', '/sitemap.xml', '/rss.xml', '/robots.txt', '/health'];

let seedPromise: Promise<unknown> | null = null;

/** Ensure a brand-new database gets demo content the first time it is hit. */
async function ensureSeeded(env: Env) {
  if (!env.AUTO_SEED || env.AUTO_SEED === '0' || env.AUTO_SEED === 'false') return;
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM users`).first<{ c: number }>();
        if ((row?.c ?? 0) === 0) {
          const result = await runSeed(env);
          console.log('[seed] initial content created', result);
        }
      } catch (error) {
        console.warn('[seed] skipped:', error instanceof Error ? error.message : error);
        seedPromise = null;
      }
    })();
  }
  await seedPromise;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const isDynamic = DYNAMIC_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix));

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...CORS_HEADERS(origin), ...SECURITY_HEADERS } });
    }

    if (isDynamic) {
      await ensureSeeded(env);
      const response = await router.handle(request, env, ctx);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries({ ...CORS_HEADERS(origin), ...SECURITY_HEADERS })) {
        if (!headers.has(key)) headers.set(key, value);
      }
      return new Response(response.body, { status: response.status, headers });
    }

    // Static asset / SPA fallback.
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      const headers = new Headers(assetResponse.headers);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
      if (!headers.has('Cache-Control')) {
        const isHashed = /\/assets\/.+\.(js|css|woff2?|png|jpg|svg|webp)$/i.test(url.pathname);
        headers.set('Cache-Control', isHashed ? 'public, max-age=31536000, immutable' : 'public, max-age=300');
      }
      return new Response(assetResponse.body, { status: assetResponse.status, headers });
    }

    // Worker-only deployments (e.g. `wrangler dev` without assets) still get
    // a useful response instead of a blank page.
    if (url.pathname === '/' || !url.pathname.startsWith('/api')) {
      return new Response(
        `<!doctype html><meta charset="utf-8"><title>Portify API</title>
         <body style="font-family:system-ui;background:#07070c;color:#eee;padding:48px">
         <h1>Portify API is running</h1>
         <p>The static front-end is not attached to this environment yet. Run <code>npm run build</code> then <code>npm run dev</code>.</p>
         <p style="color:#8b8baf">Try <a style="color:#7c5cff" href="/api/health">/api/health</a>.</p>
         </body>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS } }
      );
    }

    return json({ data: null, error: { message: 'Route not found', code: 'not_found' } }, { status: 404 });
  },

  /** Cron-free housekeeping: prune expired sessions and stale rate limits. */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const now = new Date().toISOString();
        await env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ? OR revoked_at IS NOT NULL`).bind(now).run();
        await env.DB.prepare(`DELETE FROM auth_tokens WHERE expires_at < ?`).bind(now).run();
        await env.DB.prepare(`DELETE FROM rate_limits WHERE window_start < ?`)
          .bind(new Date(Date.now() - 864e5).toISOString())
          .run();
        await primeContextSafe(env);
      })()
    );
  },
};

async function primeContextSafe(_env: Env) {
  // Placeholder for future maintenance jobs.
  return undefined;
}
