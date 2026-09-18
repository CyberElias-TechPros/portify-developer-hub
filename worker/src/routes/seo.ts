/**
 * Machine-readable surfaces: health, sitemap, RSS, robots and OG images.
 */
import type { Env } from '../env';
import type { Router } from '../lib/router';
import { escapeHtml, json, ok } from '../lib/http';
import { db, primeContext } from '../lib/context';
import { DEFAULT_SETTINGS } from '../env';

export function registerSEORoutes(router: Router<Env>) {
  router.get('/api/health', async (c) => {
    const started = Date.now();
    let database = 'unavailable';
    try {
      await c.env.DB.prepare('SELECT 1 AS ok').first();
      database = 'ok';
    } catch (error) {
      database = (error as Error).message;
    }
    return ok({
      status: database === 'ok' ? 'healthy' : 'degraded',
      service: c.env.APP_NAME ?? 'portify-api',
      environment: c.env.ENVIRONMENT ?? 'development',
      database,
      bindings: {
        d1: Boolean(c.env.DB),
        r2: Boolean(c.env.MEDIA),
        kv: Boolean(c.env.CACHE),
        assets: Boolean(c.env.ASSETS),
        resend: Boolean(c.env.RESEND_API_KEY),
      },
      latency_ms: Date.now() - started,
      time: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  router.get('/health', (c) => {
    c.req = c.req;
    return json({ status: 'ok', time: new Date().toISOString() });
  });

  router.get('/robots.txt', async (c) => {
    const origin = c.env.APP_URL || c.url.origin;
    const body = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api/',
      'Disallow: /messages',
      'Disallow: /profile',
      '',
      `Sitemap: ${origin}/sitemap.xml`,
      `Host: ${origin.replace(/^https?:\/\//, '')}`,
    ].join('\n');
    return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  });

  router.get('/sitemap.xml', async (c) => {
    const origin = c.env.APP_URL || c.url.origin;
    const [profiles, posts] = await Promise.all([
      c.env.DB.prepare(`SELECT username, updated_at FROM profiles WHERE is_public = 1 AND username IS NOT NULL LIMIT 2000`).all<any>(),
      c.env.DB.prepare(
        `SELECT b.slug, b.updated_at, p.username FROM blog_posts b JOIN profiles p ON p.id = b.user_id
          WHERE b.published = 1 AND b.is_public = 1 ORDER BY b.publish_date DESC LIMIT 2000`
      ).all<any>(),
    ]);

    const staticPaths = ['/', '/discover', '/community', '/blog', '/projects', '/skills', '/experience', '/contact', '/help'];
    const urls: string[] = staticPaths.map(
      (path) => `  <url><loc>${origin}${path}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );
    for (const row of profiles.results ?? []) {
      urls.push(
        `  <url><loc>${origin}/${escapeHtml(row.username)}</loc><lastmod>${(row.updated_at || '').slice(0, 10)}</lastmod><priority>0.9</priority></url>`
      );
    }
    for (const row of posts.results ?? []) {
      urls.push(
        `  <url><loc>${origin}/blog/${escapeHtml(row.slug)}</loc><lastmod>${(row.updated_at || '').slice(0, 10)}</lastmod><priority>0.6</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' },
    });
  });

  router.get('/rss.xml', async (c) => {
    const origin = c.env.APP_URL || c.url.origin;
    const rows = await c.env.DB.prepare(
      `SELECT b.title, b.slug, b.excerpt, b.publish_date, p.full_name, p.username FROM blog_posts b
         JOIN profiles p ON p.id = b.user_id
        WHERE b.published = 1 AND b.is_public = 1 ORDER BY b.publish_date DESC LIMIT 50`
    ).all<any>();

    const items = (rows.results ?? [])
      .map(
        (post: any) => `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${origin}/blog/${escapeHtml(post.slug)}</link>
      <guid>${origin}/blog/${escapeHtml(post.slug)}</guid>
      <pubDate>${post.publish_date ? new Date(post.publish_date).toUTCString() : ''}</pubDate>
      <description>${escapeHtml(post.excerpt ?? '')}</description>
      <author>${escapeHtml(post.full_name ?? post.username ?? 'Portify')}</author>
    </item>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>Portify — Developer Writing</title>
    <link>${origin}/blog</link>
    <description>Case studies, engineering notes and career writing from the Portify community.</description>
    <language>en</language>
${items}
</channel></rss>`;

    return new Response(xml, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' },
    });
  });

  /** Dynamic OG image rendered as SVG (zero dependencies, CDN-cacheable). */
  router.get('/api/og/:username', async (c) => {
    await primeContext(c);
    const username = c.params.username.replace(/\.(svg|png)$/i, '');
    const profile = await c.env.DB.prepare(
      `SELECT full_name, display_name, title, bio, accent, username FROM profiles WHERE lower(username) = ? LIMIT 1`
    )
      .bind(username.toLowerCase())
      .first<any>();

    const name = profile?.full_name || profile?.display_name || DEFAULT_SETTINGS.site_info.title;
    const title = profile?.title || DEFAULT_SETTINGS.site_info.description;
    const accent = profile?.accent || '#7c5cff';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07070c"/>
      <stop offset="55%" stop-color="#0d0b1a"/>
      <stop offset="100%" stop-color="#05050a"/>
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="18%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g font-family="Inter, Segoe UI, system-ui, sans-serif">
    <text x="80" y="130" fill="#8b8baf" font-size="26" letter-spacing="6">PORTIFY.DEV${profile?.username ? ` / @${escapeHtml(profile.username.toUpperCase())}` : ''}</text>
    <text x="80" y="300" fill="#ffffff" font-size="76" font-weight="700">${escapeHtml(name).slice(0, 28)}</text>
    <text x="80" y="372" fill="${accent}" font-size="34">${escapeHtml(title).slice(0, 52)}</text>
    <text x="80" y="470" fill="#a5a5bd" font-size="24">${escapeHtml((profile?.bio || 'Cinematic developer portfolios, built on the edge.').slice(0, 96))}</text>
    <rect x="80" y="520" width="220" height="6" rx="3" fill="${accent}"/>
  </g>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  });
}
