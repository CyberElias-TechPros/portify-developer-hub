/**
 * Workspace routes: bootstrap payload, public portfolio bundles, dashboard
 * summary, analytics, search, activity, notifications, account lifecycle.
 */
import { z } from 'zod';
import type { Env, SettingKey } from '../env';
import { DEFAULT_SETTINGS } from '../env';
import type { Router } from '../lib/router';
import { HttpError, ok, slugify, userAgentInfo } from '../lib/http';
import { db, primeContext, requireUser } from '../lib/context';
import { uuid } from '../lib/crypto';
import { LIMITS, rateLimit } from '../lib/ratelimit';
import { visibleColumns } from '../lib/dbcrud';
import { getTable, audit } from '../lib/tables';
import { currentUserPayload, mapProfile } from './auth';
import { ensureProfileExists, revokeAllSessions } from '../lib/auth';

const SETTING_KEYS: SettingKey[] = ['contact_info', 'social_links', 'site_info', 'theme', 'features'];

function parseSettingValue<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

export async function loadSettings(env: Env): Promise<Record<string, any>> {
  const result = await env.DB.prepare(`SELECT key, value FROM site_settings`).all<{ key: string; value: string }>();
  const stored = new Map((result.results ?? []).map((r) => [r.key, r.value]));
  const out: Record<string, any> = {};
  for (const key of SETTING_KEYS) {
    out[key] = parseSettingValue(stored.get(key), (DEFAULT_SETTINGS as any)[key]);
  }
  return out;
}

export function registerWorkspaceRoutes(router: Router<Env>) {
  // ------------------------------------------------------------- bootstrap --
  router.get('/api/bootstrap', async (c) => {
    await primeContext(c);
    const settings = await loadSettings(c.env);
    const session = db(c);
    if (!session.user) return ok({ settings, user: null, session: null, profile: null, notifications: { unread: 0 } });

    const payload = await currentUserPayload(c.env, session.user.id, session.user.email);
    const unread = await c.env.DB.prepare(
      `SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0`
    )
      .bind(session.user.id)
      .first<{ c: number }>();

    return ok({
      settings,
      user: payload,
      session: { user: payload },
      profile: payload.profile,
      notifications: { unread: unread?.c ?? 0 },
    });
  });

  // -------------------------------------------------------- site settings --
  router.get('/api/site/settings', async (c) => {
    const settings = await loadSettings(c.env);
    return ok({ settings });
  });

  router.get('/api/site/settings/:key', async (c) => {
    const key = c.params.key as SettingKey;
    if (!SETTING_KEYS.includes(key)) throw HttpError.notFound('Unknown setting');
    const row = await c.env.DB.prepare(`SELECT value FROM site_settings WHERE key = ?`).bind(key).first<{ value: string }>();
    return ok({ key, value: parseSettingValue(row?.value, (DEFAULT_SETTINGS as any)[key]) });
  });

  router.put('/api/site/settings/:key', async (c) => {
    await primeContext(c);
    requireUser(c);
    if (!db(c).isAdmin) throw HttpError.forbidden('Only administrators can change site settings');
    const key = c.params.key as SettingKey;
    if (!SETTING_KEYS.includes(key)) throw HttpError.notFound('Unknown setting');
    const body: any = await c.body();
    const value = body?.value ?? body;
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO site_settings (id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
      .bind(uuid(), key, JSON.stringify(value), now, now)
      .run();
    await audit(db(c), 'site_setting.update', key);
    return ok({ key, value });
  });

  // ------------------------------------------------------------- username --
  router.get('/api/usernames/check/:username', async (c) => {
    const username = c.params.username.trim();
    const valid = /^[a-zA-Z0-9_-]{3,30}$/.test(username);
    if (!valid) return ok({ username, available: false, reason: 'Use 3–30 letters, numbers, dashes or underscores.' });
    await primeContext(c);
    const row = await c.env.DB.prepare(`SELECT id FROM profiles WHERE lower(username) = ?`)
      .bind(username.toLowerCase())
      .first<{ id: string }>();
    const mine = row && db(c).user?.id === row.id;
    return ok({
      username,
      available: !row || !!mine,
      reason: row && !mine ? 'That username is already taken.' : null,
    });
  });

  router.get('/api/usernames/resolve/:username', async (c) => {
    const row = await c.env.DB.prepare(
      `SELECT p.id, p.username, p.full_name, p.display_name, p.title, p.avatar_url, p.bio, p.is_public
         FROM profiles p WHERE lower(p.username) = ? LIMIT 1`
    )
      .bind(c.params.username.toLowerCase())
      .first<any>();
    if (!row) throw HttpError.notFound('No portfolio found for that username');
    return ok({ userId: row.id, profile: mapProfile(row) });
  });

  // ----------------------------------------------- public portfolio bundle --
  router.get('/api/portfolio/:username', async (c) => {
    await primeContext(c);
    const username = c.params.username;
    const profileRow = await c.env.DB.prepare(`SELECT * FROM profiles WHERE lower(username) = ? OR id = ? LIMIT 1`)
      .bind(username.toLowerCase(), username)
      .first<any>();
    if (!profileRow) throw HttpError.notFound('Portfolio not found');

    const viewerId = db(c).user?.id ?? null;
    const isOwner = viewerId === profileRow.id;
    const canSeePrivate = isOwner || db(c).isAdmin;
    if (!profileRow.is_public && !canSeePrivate) {
      throw HttpError.forbidden('This portfolio is private');
    }

    const userId = profileRow.id;
    const [projects, skills, experiences, education, posts, sections, themes, testimonials, followerCount, followingCount, projectCount, postCount, reactionCount] =
      await Promise.all([
        c.env.DB.prepare(
          `SELECT ${visibleColumns(getTable('projects')).join(', ')} FROM projects
            WHERE user_id = ? ${canSeePrivate ? '' : 'AND is_public = 1'}
            ORDER BY featured DESC, position ASC, created_at DESC LIMIT 60`
        )
          .bind(userId)
          .all<any>(),
        c.env.DB.prepare(
          `SELECT id, user_id, name, category, proficiency, icon_url, year_acquired, endorsed, description
             FROM skills WHERE user_id = ? ORDER BY proficiency DESC LIMIT 80`
        )
          .bind(userId)
          .all<any>(),
        c.env.DB.prepare(
          `SELECT id, user_id, company, position, employment, location, start_date, end_date, description, logo_url, company_url, technologies, projects
             FROM experiences WHERE user_id = ? ${canSeePrivate ? '' : 'AND is_public = 1'} ORDER BY start_date DESC LIMIT 40`
        )
          .bind(userId)
          .all<any>(),
        c.env.DB.prepare(
          `SELECT id, user_id, institution, degree, field, location, start_date, end_date, description, logo_url
             FROM education WHERE user_id = ? ${canSeePrivate ? '' : 'AND is_public = 1'} ORDER BY start_date DESC LIMIT 20`
        )
          .bind(userId)
          .all<any>(),
        c.env.DB.prepare(
          `SELECT id, user_id, title, slug, excerpt, cover_image_url, category, series, tags, reading_time, views, likes, publish_date, created_at
             FROM blog_posts WHERE user_id = ? ${canSeePrivate ? '' : 'AND published = 1 AND is_public = 1'}
            ORDER BY publish_date DESC LIMIT 30`
        )
          .bind(userId)
          .all<any>(),
        c.env.DB.prepare(
          `SELECT id, user_id, type, title, subtitle, content, visible, position_order FROM portfolio_sections
            WHERE user_id = ? ORDER BY position_order ASC`
        )
          .bind(userId)
          .all<any>(),
        c.env.DB.prepare(`SELECT config FROM themes WHERE user_id = ? AND is_active = 1 LIMIT 1`).bind(userId).first<any>(),
        c.env.DB.prepare(
          `SELECT t.*, p.full_name AS author_full_name, p.username AS author_username, p.avatar_url AS author_avatar, p.title AS author_title
             FROM testimonials t LEFT JOIN profiles p ON p.id = t.author_id
            WHERE t.user_id = ? AND (t.approved = 1 OR ? = 1) ORDER BY t.created_at DESC LIMIT 12`
        )
          .bind(userId, canSeePrivate ? 1 : 0)
          .all<any>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE following_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE follower_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM projects WHERE user_id = ? AND is_public = 1`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM blog_posts WHERE user_id = ? AND published = 1`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM reactions WHERE content_type = 'profile' AND content_id = ?`).bind(userId).first<{ c: number }>(),
      ]);

    const parseJson = (value: unknown, fallback: any) => {
      if (typeof value !== 'string') return value ?? fallback;
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    };

    const result = {
      profile: {
        ...mapProfile(profileRow),
        email: profileRow.is_public ? profileRow.email : profileRow.email,
      },
      stats: {
        projects: projectCount?.c ?? 0,
        posts: postCount?.c ?? 0,
        followers: followerCount?.c ?? 0,
        following: followingCount?.c ?? 0,
        endorsements: (skills.results ?? []).reduce((sum, s: any) => sum + (s.endorsed ?? 0), 0),
        reactions: reactionCount?.c ?? 0,
        views: profileRow.profile_views ?? 0,
      },
      projects: (projects.results ?? []).map((p: any) => ({
        ...p,
        tags: parseJson(p.tags, []),
        gallery: parseJson(p.gallery, []),
        featured: !!p.featured,
        is_public: !!p.is_public,
      })),
      skills: skills.results ?? [],
      experiences: (experiences.results ?? []).map((e: any) => ({
        ...e,
        technologies: parseJson(e.technologies, []),
        projects: parseJson(e.projects, []),
      })),
      education: education.results ?? [],
      posts: (posts.results ?? []).map((p: any) => ({ ...p, tags: parseJson(p.tags, []) })),
      sections: (sections.results ?? []).map((s: any) => ({
        ...s,
        content: parseJson(s.content, {}),
        visible: !!s.visible,
      })),
      theme: themes?.config ? parseJson(themes.config, {}) : null,
      testimonials: (testimonials.results ?? []).map((t: any) => ({
        ...t,
        approved: !!t.approved,
        author: t.author_id
          ? {
              id: t.author_id,
              full_name: t.author_full_name,
              username: t.author_username,
              avatar_url: t.author_avatar,
              title: t.author_title,
            }
          : null,
      })),
      isOwner,
    };

    // Track the view (owner previews don't inflate the numbers).
    if (!isOwner) {
      c.exec.waitUntil(trackProfileView(c.env, c.req, profileRow.id, db(c).user?.id ?? null, `/@${profileRow.username ?? userId}`));
    }

    return ok(result);
  });

  // ------------------------------------------------------------ dashboard --
  router.get('/api/dashboard', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const userId = user.id;
    const range = c.query.get('range') || '30d';
    const since = rangeStart(range);

    const [projectCount, skillCount, expCount, postCount, msgCount, unreadMsg, followerCount, viewCount, reactionCount, commentCount] =
      await Promise.all([
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM projects WHERE user_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM skills WHERE user_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM experiences WHERE user_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM blog_posts WHERE user_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM contact_messages WHERE recipient_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM contact_messages WHERE recipient_id = ? AND read = 0`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE following_id = ?`).bind(userId).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM analytics_events WHERE owner_id = ? AND created_at >= ?`)
          .bind(userId, since)
          .first<{ c: number }>(),
        c.env.DB.prepare(
          `SELECT COUNT(*) AS c FROM reactions r JOIN projects p ON p.id = r.content_id WHERE p.user_id = ? AND r.content_type = 'project'`
        )
          .bind(userId)
          .first<{ c: number }>(),
        c.env.DB.prepare(
          `SELECT COUNT(*) AS c FROM comments cm JOIN projects p ON p.id = cm.content_id WHERE p.user_id = ? AND cm.content_type = 'project'`
        )
          .bind(userId)
          .first<{ c: number }>(),
      ]);

    const profile = await c.env.DB.prepare(`SELECT * FROM profiles WHERE id = ?`).bind(userId).first<any>();
    const score = completeness(profile, {
      projects: projectCount?.c ?? 0,
      skills: skillCount?.c ?? 0,
      experiences: expCount?.c ?? 0,
      posts: postCount?.c ?? 0,
    });

    return ok({
      counts: {
        projects: projectCount?.c ?? 0,
        skills: skillCount?.c ?? 0,
        experiences: expCount?.c ?? 0,
        posts: postCount?.c ?? 0,
        messages: msgCount?.c ?? 0,
        unreadMessages: unreadMsg?.c ?? 0,
        followers: followerCount?.c ?? 0,
        views: viewCount?.c ?? 0,
        reactions: reactionCount?.c ?? 0,
        comments: commentCount?.c ?? 0,
      },
      completeness: score,
      profile: mapProfile(profile),
      range,
    });
  });

  // ------------------------------------------------------------ analytics --
  router.get('/api/analytics/me', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const range = c.query.get('range') || '30d';
    const since = rangeStart(range);
    const ownerFilter = db(c).isAdmin && c.query.get('scope') === 'all' ? '' : 'AND owner_id = ?';
    const params = db(c).isAdmin && c.query.get('scope') === 'all' ? [since] : [since, user.id];

    const [daily, paths, referrers, devices, countries, totals, recent] = await Promise.all([
      c.env.DB.prepare(
        `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS views, COUNT(DISTINCT session_key) AS visitors
           FROM analytics_events WHERE created_at >= ? ${ownerFilter}
          GROUP BY day ORDER BY day ASC LIMIT 120`
      )
        .bind(...params)
        .all(),
      c.env.DB.prepare(
        `SELECT path, COUNT(*) AS views FROM analytics_events WHERE created_at >= ? ${ownerFilter}
          GROUP BY path ORDER BY views DESC LIMIT 12`
      )
        .bind(...params)
        .all(),
      c.env.DB.prepare(
        `SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS referrer, COUNT(*) AS views
           FROM analytics_events WHERE created_at >= ? ${ownerFilter}
          GROUP BY referrer ORDER BY views DESC LIMIT 10`
      )
        .bind(...params)
        .all(),
      c.env.DB.prepare(
        `SELECT COALESCE(device, 'unknown') AS device, COUNT(*) AS views FROM analytics_events
          WHERE created_at >= ? ${ownerFilter} GROUP BY device ORDER BY views DESC LIMIT 6`
      )
        .bind(...params)
        .all(),
      c.env.DB.prepare(
        `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS views FROM analytics_events
          WHERE created_at >= ? ${ownerFilter} GROUP BY country ORDER BY views DESC LIMIT 10`
      )
        .bind(...params)
        .all(),
      c.env.DB.prepare(
        `SELECT COUNT(*) AS views, COUNT(DISTINCT session_key) AS visitors FROM analytics_events
          WHERE created_at >= ? ${ownerFilter}`
      )
        .bind(...params)
        .first<{ views: number; visitors: number }>(),
      c.env.DB.prepare(
        `SELECT event_type, path, referrer, country, device, browser, created_at FROM analytics_events
          WHERE created_at >= ? ${ownerFilter} ORDER BY created_at DESC LIMIT 25`
      )
        .bind(...params)
        .all(),
    ]);

    const engagement = await c.env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM reactions WHERE content_id IN (SELECT id FROM projects WHERE user_id = ?)) AS reactions,
         (SELECT COUNT(*) FROM comments WHERE content_id IN (SELECT id FROM projects WHERE user_id = ?)) AS comments,
         (SELECT COUNT(*) FROM user_follows WHERE following_id = ?) AS followers,
         (SELECT COUNT(*) FROM skill_endorsements WHERE skill_id IN (SELECT id FROM skills WHERE user_id = ?)) AS endorsements`
    )
      .bind(user.id, user.id, user.id, user.id)
      .first<any>();

    return ok({
      range,
      totals: {
        views: totals?.views ?? 0,
        visitors: totals?.visitors ?? 0,
        reactions: engagement?.reactions ?? 0,
        comments: engagement?.comments ?? 0,
        followers: engagement?.followers ?? 0,
        endorsements: engagement?.endorsements ?? 0,
      },
      daily: daily.results ?? [],
      paths: paths.results ?? [],
      referrers: referrers.results ?? [],
      devices: devices.results ?? [],
      countries: countries.results ?? [],
      recent: recent.results ?? [],
    });
  });

  /** Public beacon used by portfolio pages. */
  router.post('/api/analytics/event', async (c) => {
    const body = z
      .object({
        owner_id: z.string().min(1).optional(),
        username: z.string().optional(),
        event_type: z.string().max(40).default('page_view'),
        path: z.string().max(300).optional(),
        referrer: z.string().max(300).optional(),
        session_key: z.string().max(80).optional(),
        metadata: z.record(z.any()).optional(),
      })
      .parse(await c.body());

    await primeContext(c);
    await rateLimit(c.env, { ...LIMITS.analytics, identity: c.req.headers.get('CF-Connecting-IP') || 'anon' });

    let ownerId = body.owner_id ?? null;
    if (!ownerId && body.username) {
      const row = await c.env.DB.prepare(`SELECT id FROM profiles WHERE lower(username) = ?`)
        .bind(body.username.toLowerCase())
        .first<{ id: string }>();
      ownerId = row?.id ?? null;
    }

    const { device, browser, os } = userAgentInfo(c.req);
    const cf: any = (c.req as any).cf ?? {};
    const sessionKey = body.session_key || null;

    if (body.event_type === 'page_view' && ownerId && sessionKey) {
      const duplicate = await c.env.DB.prepare(
        `SELECT id FROM analytics_events WHERE owner_id = ? AND session_key = ? AND path = ?
           AND created_at > ? LIMIT 1`
      )
        .bind(ownerId, sessionKey, body.path ?? '/', new Date(Date.now() - 6 * 3600 * 1000).toISOString())
        .first();
      if (duplicate) return ok({ tracked: false, reason: 'duplicate' });
    }

    await c.env.DB.prepare(
      `INSERT INTO analytics_events (id, owner_id, viewer_id, session_key, event_type, path, referrer, country, city, device, browser, os, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uuid(),
        ownerId,
        db(c).user?.id ?? null,
        sessionKey,
        body.event_type,
        body.path ?? null,
        body.referrer ?? c.req.headers.get('Referer') ?? null,
        cf.country ?? null,
        cf.city ?? null,
        device,
        browser,
        os,
        JSON.stringify(body.metadata ?? {}),
        new Date().toISOString()
      )
      .run();

    return ok({ tracked: true });
  });

  // --------------------------------------------------------------- search --
  router.get('/api/search', async (c) => {
    await primeContext(c);
    const q = (c.query.get('q') || '').trim();
    const limit = Math.min(parseInt(c.query.get('limit') || '8', 10) || 8, 25);
    if (q.length < 2) return ok({ people: [], projects: [], posts: [], query: q });
    const like = `%${q.toLowerCase()}%`;

    const [people, projects, posts] = await Promise.all([
      c.env.DB.prepare(
        `SELECT id, username, full_name, display_name, title, avatar_url, bio, location FROM profiles
          WHERE is_public = 1 AND (lower(full_name) LIKE ? OR lower(username) LIKE ? OR lower(title) LIKE ? OR lower(bio) LIKE ?)
          LIMIT ?`
      )
        .bind(like, like, like, like, limit)
        .all<any>(),
      c.env.DB.prepare(
        `SELECT p.id, p.title, p.description, p.tags, p.image_url, p.user_id, pr.username, pr.full_name, pr.avatar_url
           FROM projects p LEFT JOIN profiles pr ON pr.id = p.user_id
          WHERE p.is_public = 1 AND (lower(p.title) LIKE ? OR lower(p.description) LIKE ? OR lower(p.tags) LIKE ?)
          LIMIT ?`
      )
        .bind(like, like, like, limit)
        .all<any>(),
      c.env.DB.prepare(
        `SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image_url, b.publish_date, b.reading_time, pr.username, pr.full_name, pr.avatar_url
           FROM blog_posts b LEFT JOIN profiles pr ON pr.id = b.user_id
          WHERE b.published = 1 AND b.is_public = 1 AND (lower(b.title) LIKE ? OR lower(b.excerpt) LIKE ? OR lower(b.content) LIKE ?)
          LIMIT ?`
      )
        .bind(like, like, like, limit)
        .all<any>(),
    ]);

    return ok({
      query: q,
      people: people.results ?? [],
      projects: projects.results ?? [],
      posts: posts.results ?? [],
    });
  });

  // ------------------------------------------------------- public platform --
  router.get('/api/stats/public', async (c) => {
    const [portfolios, projects, posts, reactions, skills] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM profiles WHERE is_public = 1`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM projects WHERE is_public = 1`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM blog_posts WHERE published = 1`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM reactions`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM skills`).first<{ c: number }>(),
    ]);
    return ok({
      portfolios: portfolios?.c ?? 0,
      projects: projects?.c ?? 0,
      posts: posts?.c ?? 0,
      reactions: reactions?.c ?? 0,
      skills: skills?.c ?? 0,
    });
  });

  /** Featured public portfolios for the landing page. */
  router.get('/api/community/featured', async (c) => {
    const limit = Math.min(parseInt(c.query.get('limit') || '8', 10) || 8, 24);
    const rows = await c.env.DB.prepare(
      `SELECT p.id, p.username, p.full_name, p.display_name, p.title, p.bio, p.avatar_url, p.accent, p.location,
              (SELECT COUNT(*) FROM projects pr WHERE pr.user_id = p.id AND pr.is_public = 1) AS project_count,
              (SELECT COUNT(*) FROM skills s WHERE s.user_id = p.id) AS skill_count,
              (SELECT COUNT(*) FROM user_follows f WHERE f.following_id = p.id) AS follower_count
         FROM profiles p
        WHERE p.is_public = 1 AND p.username IS NOT NULL
        ORDER BY follower_count DESC, project_count DESC, p.created_at ASC
        LIMIT ?`
    )
      .bind(limit)
      .all<any>();
    return ok({ people: rows.results ?? [] });
  });

  // ---------------------------------------------------------------- follow --
  router.get('/api/community/people', async (c) => {
    await primeContext(c);
    const q = (c.query.get('q') || '').trim().toLowerCase();
    const limit = Math.min(parseInt(c.query.get('limit') || '24', 10) || 24, 60);
    const rows = await c.env.DB.prepare(
      `SELECT p.id, p.username, p.full_name, p.display_name, p.title, p.bio, p.location, p.avatar_url, p.accent,
              (SELECT COUNT(*) FROM projects pr WHERE pr.user_id = p.id AND pr.is_public = 1) AS project_count,
              (SELECT COUNT(*) FROM user_follows f WHERE f.following_id = p.id) AS follower_count
         FROM profiles p
        WHERE p.is_public = 1 AND p.username IS NOT NULL
          ${q ? 'AND (lower(p.full_name) LIKE ? OR lower(p.username) LIKE ? OR lower(p.title) LIKE ?)' : ''}
        ORDER BY follower_count DESC, p.created_at ASC LIMIT ?`
    )
      .bind(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []), limit)
      .all<any>();

    let following = new Set<string>();
    if (db(c).user) {
      const rows2 = await c.env.DB.prepare(`SELECT following_id FROM user_follows WHERE follower_id = ?`)
        .bind(db(c).user!.id)
        .all<{ following_id: string }>();
      following = new Set((rows2.results ?? []).map((r) => r.following_id));
    }

    return ok({
      people: (rows.results ?? []).map((p: any) => ({ ...p, is_following: following.has(p.id), is_self: p.id === db(c).user?.id })),
    });
  });

  // -------------------------------------------------------------- activity --
  router.get('/api/activity', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const scope = c.query.get('scope') || 'following';
    const limit = Math.min(parseInt(c.query.get('limit') || '30', 10) || 30, 100);

    const sql =
      scope === 'mine'
        ? `SELECT a.*, pr.username, pr.full_name, pr.avatar_url, pr.title FROM activity_feed a
             LEFT JOIN profiles pr ON pr.id = a.actor_id WHERE a.actor_id = ? ORDER BY a.created_at DESC LIMIT ?`
        : `SELECT a.*, pr.username, pr.full_name, pr.avatar_url, pr.title FROM activity_feed a
             LEFT JOIN profiles pr ON pr.id = a.actor_id
            WHERE a.actor_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)
               OR a.user_id = ?
            ORDER BY a.created_at DESC LIMIT ?`;

    const params = scope === 'mine' ? [user.id, limit] : [user.id, user.id, limit];
    const rows = await c.env.DB.prepare(sql).bind(...params).all<any>();
    return ok({
      activity: (rows.results ?? []).map((row: any) => ({
        ...row,
        metadata: safeParse(row.metadata, {}),
        actor: {
          id: row.actor_id,
          username: row.username,
          full_name: row.full_name,
          avatar_url: row.avatar_url,
          title: row.title,
        },
      })),
    });
  });

  // --------------------------------------------------------- notifications --
  router.get('/api/notifications', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const rows = await c.env.DB.prepare(
      `SELECT n.*, pr.username, pr.full_name, pr.avatar_url FROM notifications n
         LEFT JOIN profiles pr ON pr.id = n.actor_id
        WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50`
    )
      .bind(user.id)
      .all<any>();
    const unread = (rows.results ?? []).filter((r: any) => !r.read).length;
    return ok({
      notifications: (rows.results ?? []).map((row: any) => ({
        ...row,
        read: !!row.read,
        actor: row.actor_id
          ? { id: row.actor_id, username: row.username, full_name: row.full_name, avatar_url: row.avatar_url }
          : null,
      })),
      unread,
    });
  });

  router.post('/api/notifications/read', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body = await c.body<{ ids?: string[]; all?: boolean }>();
    if (body?.all) {
      await c.env.DB.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).bind(user.id).run();
    } else if (body?.ids?.length) {
      const placeholders = body.ids.map(() => '?').join(', ');
      await c.env.DB.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ? AND id IN (${placeholders})`)
        .bind(user.id, ...body.ids)
        .run();
    }
    return ok({ success: true });
  });

  // ---------------------------------------------------------- account data --
  router.get('/api/account/export', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const tables = ['profiles', 'projects', 'skills', 'experiences', 'education', 'blog_posts', 'portfolio_sections', 'themes', 'resumes', 'comments', 'reactions', 'user_follows', 'testimonials'];
    const out: Record<string, unknown> = { exported_at: new Date().toISOString(), user: { id: user.id, email: user.email } };
    for (const table of tables) {
      const column = ['profiles', 'user_id'].includes(table) || table === 'user_follows' ? 'user_id' : 'user_id';
      const rows = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE ${table === 'profiles' ? 'id' : column} = ?`)
        .bind(user.id)
        .all();
      out[table] = rows.results ?? [];
    }
    return ok(out);
  });

  router.delete('/api/account', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body = await c.body<{ confirm?: string }>();
    if (body?.confirm !== 'DELETE') {
      throw HttpError.badRequest('Send { "confirm": "DELETE" } to permanently remove your account');
    }
    await revokeAllSessions(c.env, user.id);
    await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id).run();
    await audit({ env: c.env, user: null, isAdmin: false }, 'account.delete', user.id);
    return ok({ deleted: true });
  });

  // ------------------------------------------------------------ onboarding --
  router.post('/api/onboarding', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body = z
      .object({
        username: z.string().trim().regex(/^[a-zA-Z0-9_-]{3,30}$/, 'Usernames use 3–30 letters, numbers, dashes or underscores').optional(),
        full_name: z.string().trim().max(120).optional(),
        title: z.string().trim().max(160).optional(),
        bio: z.string().trim().max(600).optional(),
        location: z.string().trim().max(120).optional(),
        github: z.string().trim().max(200).optional(),
        linkedin: z.string().trim().max(200).optional(),
        website: z.string().trim().max(200).optional(),
        avatar_url: z.string().trim().max(500).optional(),
        accent: z.string().trim().max(32).optional(),
        intent: z.enum(['job', 'freelance', 'community', 'personal']).optional(),
        complete: z.boolean().optional(),
      })
      .parse(await c.body());

    const now = new Date().toISOString();
    // Only real profile columns may be written — anything else (e.g. the UI's
    // `intent` hint) is acknowledged but never sent to SQLite.
    const writeable = new Set([
      'username', 'full_name', 'display_name', 'title', 'bio', 'long_bio', 'location', 'timezone',
      'pronouns', 'availability', 'email', 'phone', 'website', 'github', 'linkedin', 'twitter',
      'instagram', 'youtube', 'dribbble', 'resume_url', 'avatar_url', 'cover_url', 'accent',
    ]);
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (key === 'complete' || key === 'intent' || value === undefined) continue;
      if (!writeable.has(key)) continue;
      sets.push(`${key} = ?`);
      params.push(value);
    }
    if (sets.length) {
      await c.env.DB.prepare(`UPDATE profiles SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`)
        .bind(...params, now, user.id)
        .run();
    }

    if (body.username) {
      const taken = await c.env.DB.prepare(`SELECT id FROM profiles WHERE lower(username) = ? AND id <> ?`)
        .bind(body.username.toLowerCase(), user.id)
        .first();
      if (taken) throw HttpError.conflict('That username is already taken');
      await c.env.DB.prepare(
        `INSERT INTO usernames (id, user_id, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(username) DO UPDATE SET updated_at = excluded.updated_at`
      )
        .bind(uuid(), user.id, body.username, now, now)
        .run();
    }

    if (body.complete) {
      await c.env.DB.prepare(`UPDATE profiles SET onboarding_step = 4, updated_at = ? WHERE id = ?`).bind(now, user.id).run();
    } else {
      await c.env.DB.prepare(`UPDATE profiles SET onboarding_step = MAX(onboarding_step, 1), updated_at = ? WHERE id = ?`)
        .bind(now, user.id)
        .run();
    }

    const payload = await currentUserPayload(c.env, user.id, user.email);
    return ok({ profile: payload.profile, user: payload });
  });

  // ------------------------------------------------------------ newsletter --
  router.post('/api/newsletter', async (c) => {
    const { email, source } = z
      .object({ email: z.string().email('Enter a valid email address'), source: z.string().max(40).optional() })
      .parse(await c.body());
    await rateLimit(c.env, { ...LIMITS.newsletter, identity: c.req.headers.get('CF-Connecting-IP') || 'anon' });
    const existing = await c.env.DB.prepare(`SELECT id FROM newsletter_subscribers WHERE lower(email) = ?`)
      .bind(email.toLowerCase())
      .first();
    if (!existing) {
      await c.env.DB.prepare(`INSERT INTO newsletter_subscribers (id, email, source, created_at) VALUES (?, ?, ?, ?)`)
        .bind(uuid(), email.toLowerCase(), source ?? 'footer', new Date().toISOString())
        .run();
    }
    return ok({ subscribed: true, message: "You're on the list — welcome aboard." });
  });

  // -------------------------------------------------------- own profile --
  const PROFILE_FIELDS = [
    'username', 'full_name', 'display_name', 'title', 'bio', 'long_bio', 'location', 'timezone', 'pronouns',
    'availability', 'email', 'phone', 'website', 'github', 'linkedin', 'twitter', 'instagram', 'youtube',
    'dribbble', 'resume_url', 'avatar_url', 'cover_url', 'accent', 'is_public',
  ];

  router.patch('/api/profile', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body: any = (await c.body()) ?? {};
    await ensureProfileExists(c.env, user.id, user.email);

    if (body.username !== undefined) {
      const candidate = String(body.username).trim();
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(candidate)) {
        throw HttpError.badRequest('Usernames use 3–30 letters, numbers, dashes or underscores');
      }
      const taken = await c.env.DB.prepare(`SELECT id FROM profiles WHERE lower(username) = ? AND id <> ?`)
        .bind(candidate.toLowerCase(), user.id)
        .first();
      if (taken) throw HttpError.conflict('That username is already taken');
      body.username = candidate;
    }

    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (!PROFILE_FIELDS.includes(key)) continue;
      sets.push(`${key} = ?`);
      params.push(typeof value === 'boolean' ? (value ? 1 : 0) : value === '' ? null : value);
    }
    if (!sets.length) throw HttpError.badRequest('Nothing to update');

    await c.env.DB.prepare(`UPDATE profiles SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`)
      .bind(...params, new Date().toISOString(), user.id)
      .run();

    if (body.username) {
      const now = new Date().toISOString();
      await c.env.DB.prepare(
        `INSERT INTO usernames (id, user_id, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(username) DO UPDATE SET user_id = excluded.user_id, updated_at = excluded.updated_at`
      )
        .bind(uuid(), user.id, body.username, now, now)
        .run();
    }

    const row = await c.env.DB.prepare(`SELECT * FROM profiles WHERE id = ?`).bind(user.id).first<any>();
    return ok({ profile: mapProfile(row) });
  });

  router.post('/api/profile/avatar', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const { url } = z.object({ url: z.string().min(4) }).parse(await c.body());
    await c.env.DB.prepare(`UPDATE profiles SET avatar_url = ?, updated_at = ? WHERE id = ?`)
      .bind(url, new Date().toISOString(), user.id)
      .run();
    const row = await c.env.DB.prepare(`SELECT * FROM profiles WHERE id = ?`).bind(user.id).first<any>();
    return ok({ profile: mapProfile(row) });
  });

  // ------------------------------------------------------- profile by user --
  router.get('/api/profiles/me', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    await ensureProfileExists(c.env, user.id, user.email);
    const row = await c.env.DB.prepare(`SELECT * FROM profiles WHERE id = ?`).bind(user.id).first<any>();
    return ok({ profile: mapProfile(row) });
  });
}

function rangeStart(range: string): string {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '365d' ? 365 : 30;
  return new Date(Date.now() - days * 864e5).toISOString();
}

function safeParse(value: unknown, fallback: any) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function completeness(
  profile: any,
  counts: { projects: number; skills: number; experiences: number; posts: number }
) {
  const checks = [
    { key: 'avatar', label: 'Add a profile photo', done: Boolean(profile?.avatar_url), weight: 10 },
    { key: 'headline', label: 'Write a headline', done: Boolean(profile?.title), weight: 10 },
    { key: 'bio', label: 'Tell your story', done: Boolean(profile?.bio && profile.bio.length > 40), weight: 15 },
    { key: 'location', label: 'Add your location', done: Boolean(profile?.location), weight: 5 },
    { key: 'links', label: 'Connect GitHub or LinkedIn', done: Boolean(profile?.github || profile?.linkedin), weight: 10 },
    { key: 'projects', label: 'Publish at least 3 projects', done: counts.projects >= 3, weight: 25 },
    { key: 'skills', label: 'List at least 6 skills', done: counts.skills >= 6, weight: 10 },
    { key: 'experience', label: 'Add work history', done: counts.experiences >= 1, weight: 10 },
    { key: 'writing', label: 'Share your first case study', done: counts.posts >= 1, weight: 5 },
  ];
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.filter((c) => c.done).reduce((sum, c) => sum + c.weight, 0);
  return {
    score: Math.round((earned / total) * 100),
    checks,
    nextSteps: checks.filter((c) => !c.done).slice(0, 3),
  };
}

async function trackProfileView(env: Env, req: Request, ownerId: string, viewerId: string | null, path: string) {
  try {
    const { device, browser, os } = userAgentInfo(req);
    const cf: any = (req as any).cf ?? {};
    await env.DB.prepare(
      `INSERT INTO analytics_events (id, owner_id, viewer_id, session_key, event_type, path, referrer, country, city, device, browser, os, metadata, created_at)
       VALUES (?, ?, ?, ?, 'page_view', ?, ?, ?, ?, ?, ?, ?, '{}', ?)`
    )
      .bind(
        uuid(),
        ownerId,
        viewerId,
        req.headers.get('X-Portify-Session'),
        path,
        req.headers.get('Referer') ?? null,
        cf.country ?? null,
        cf.city ?? null,
        device,
        browser,
        os,
        new Date().toISOString()
      )
      .run();
    await env.DB.prepare(`UPDATE profiles SET profile_views = profile_views + 1 WHERE id = ?`).bind(ownerId).run();
  } catch (error) {
    console.warn('[analytics] profile view tracking failed', error);
  }
}

export { slugify };
