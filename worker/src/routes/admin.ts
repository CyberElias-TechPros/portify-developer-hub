/**
 * Administrator routes: user management, platform analytics, moderation,
 * audit trail, seed utilities.
 */
import { z } from 'zod';
import type { Env } from '../env';
import type { Router } from '../lib/router';
import { HttpError, ok } from '../lib/http';
import { db, primeContext, requireAdmin } from '../lib/context';
import { uuid } from '../lib/crypto';
import { audit } from '../lib/tables';
import { revokeAllSessions } from '../lib/auth';
import { runSeed, wipeDemoData } from '../lib/seed';

export function registerAdminRoutes(router: Router<Env>) {
  router.get('/api/admin/stats', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const [users, activeUsers, profiles, projects, posts, comments, reactions, messages, unread, views, follows, media] =
      await Promise.all([
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM users`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM users WHERE is_active = 1`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM profiles WHERE is_public = 1`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM projects`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM blog_posts`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM comments`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM reactions`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM contact_messages`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM contact_messages WHERE read = 0`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM analytics_events`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows`).first<{ c: number }>(),
        c.env.DB.prepare(`SELECT COUNT(*) AS c FROM media_uploads`).first<{ c: number }>(),
      ]);

    const growth = await c.env.DB.prepare(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS signups FROM users
        WHERE created_at >= ? GROUP BY day ORDER BY day ASC LIMIT 60`
    )
      .bind(new Date(Date.now() - 30 * 864e5).toISOString())
      .all();

    const traffic = await c.env.DB.prepare(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS views FROM analytics_events
        WHERE created_at >= ? GROUP BY day ORDER BY day ASC LIMIT 60`
    )
      .bind(new Date(Date.now() - 30 * 864e5).toISOString())
      .all();

    return ok({
      totals: {
        users: users?.c ?? 0,
        activeUsers: activeUsers?.c ?? 0,
        publicProfiles: profiles?.c ?? 0,
        projects: projects?.c ?? 0,
        posts: posts?.c ?? 0,
        comments: comments?.c ?? 0,
        reactions: reactions?.c ?? 0,
        messages: messages?.c ?? 0,
        unreadMessages: unread?.c ?? 0,
        pageViews: views?.c ?? 0,
        follows: follows?.c ?? 0,
        uploads: media?.c ?? 0,
      },
      growth: growth.results ?? [],
      traffic: traffic.results ?? [],
    });
  });

  router.get('/api/admin/users', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const q = (c.query.get('q') || '').toLowerCase();
    const limit = Math.min(parseInt(c.query.get('limit') || '100', 10) || 100, 300);

    const rows = await c.env.DB.prepare(
      `SELECT u.id, u.email, u.provider, u.email_verified, u.is_active, u.last_sign_in_at, u.created_at,
              p.full_name, p.username, p.title, p.avatar_url, p.is_public,
              GROUP_CONCAT(ur.role) AS roles,
              (SELECT COUNT(*) FROM projects pr WHERE pr.user_id = u.id) AS project_count,
              (SELECT COUNT(*) FROM blog_posts b WHERE b.user_id = u.id) AS post_count
         FROM users u
         LEFT JOIN profiles p ON p.id = u.id
         LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.is_active = 1
          OR (SELECT COUNT(*) FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.role = 'admin') > 0
        GROUP BY u.id
        ${q ? 'HAVING lower(u.email) LIKE ? OR lower(p.full_name) LIKE ? OR lower(p.username) LIKE ?' : ''}
        ORDER BY u.created_at DESC LIMIT ?`
    )
      .bind(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []), limit)
      .all<any>();

    return ok({
      users: (rows.results ?? []).map((row: any) => ({
        ...row,
        roles: (row.roles || 'user').split(','),
        role: (row.roles || 'user').split(',')[0],
        email_verified: !!row.email_verified,
        is_active: !!row.is_active,
        is_public: !!row.is_public,
        project_count: row.project_count ?? 0,
        post_count: row.post_count ?? 0,
      })),
    });
  });

  router.patch('/api/admin/users/:id/role', async (c) => {
    await primeContext(c);
    const admin = requireAdmin(c);
    const { role } = z.object({ role: z.enum(['admin', 'moderator', 'user']) }).parse(await c.body());
    const targetId = c.params.id;
    if (targetId === admin.id && role !== 'admin') {
      throw HttpError.badRequest('You cannot remove your own administrator role');
    }
    await c.env.DB.prepare(`DELETE FROM user_roles WHERE user_id = ?`).bind(targetId).run();
    await c.env.DB.prepare(`INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, ?)`)
      .bind(uuid(), targetId, role, new Date().toISOString())
      .run();
    await audit(db(c), 'user.role_change', targetId, { role });
    return ok({ userId: targetId, role });
  });

  router.patch('/api/admin/users/:id/status', async (c) => {
    await primeContext(c);
    const admin = requireAdmin(c);
    const { is_active } = z.object({ is_active: z.boolean() }).parse(await c.body());
    if (c.params.id === admin.id) throw HttpError.badRequest('You cannot deactivate your own account');
    await c.env.DB.prepare(`UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?`)
      .bind(is_active ? 1 : 0, new Date().toISOString(), c.params.id)
      .run();
    if (!is_active) await revokeAllSessions(c.env, c.params.id);
    await audit(db(c), is_active ? 'user.reactivate' : 'user.deactivate', c.params.id);
    return ok({ userId: c.params.id, is_active });
  });

  router.get('/api/admin/audit', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const rows = await c.env.DB.prepare(
      `SELECT a.*, p.full_name, p.username FROM audit_log a LEFT JOIN profiles p ON p.id = a.actor_id
        ORDER BY a.created_at DESC LIMIT 150`
    ).all<any>();
    return ok({
      entries: (rows.results ?? []).map((row: any) => ({
        ...row,
        metadata: safeParse(row.metadata, {}),
      })),
    });
  });

  router.get('/api/admin/content', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const [projects, posts, comments] = await Promise.all([
      c.env.DB.prepare(
        `SELECT p.id, p.title, p.is_public, p.featured, p.created_at, p.user_id, pr.username FROM projects p
           LEFT JOIN profiles pr ON pr.id = p.user_id ORDER BY p.created_at DESC LIMIT 50`
      ).all(),
      c.env.DB.prepare(
        `SELECT b.id, b.title, b.slug, b.published, b.is_public, b.created_at, b.user_id, pr.username FROM blog_posts b
           LEFT JOIN profiles pr ON pr.id = b.user_id ORDER BY b.created_at DESC LIMIT 50`
      ).all(),
      c.env.DB.prepare(
        `SELECT c.id, c.content, c.content_type, c.created_at, c.user_id, pr.username FROM comments c
           LEFT JOIN profiles pr ON pr.id = c.user_id ORDER BY c.created_at DESC LIMIT 50`
      ).all(),
    ]);
    return ok({
      projects: projects.results ?? [],
      posts: posts.results ?? [],
      comments: comments.results ?? [],
    });
  });

  // Moderation: force-hide or remove any content.
  router.post('/api/admin/content/toggle-visibility', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const { table, id, is_public } = z
      .object({ table: z.enum(['projects', 'blog_posts']), id: z.string().min(1), is_public: z.boolean() })
      .parse(await c.body());
    await c.env.DB.prepare(`UPDATE ${table} SET is_public = ?, updated_at = ? WHERE id = ?`)
      .bind(is_public ? 1 : 0, new Date().toISOString(), id)
      .run();
    await audit(db(c), 'content.visibility', `${table}:${id}`, { is_public });
    return ok({ table, id, is_public });
  });

  router.delete('/api/admin/content/:table/:id', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const table = c.params.table;
    if (!['projects', 'blog_posts', 'comments', 'contact_messages', 'testimonials'].includes(table)) {
      throw HttpError.badRequest('That collection is not moderatable');
    }
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(c.params.id).run();
    await audit(db(c), 'content.delete', `${table}:${c.params.id}`);
    return ok({ deleted: true });
  });

  // ------------------------------------------------------------------ seed --
  router.post('/api/admin/seed', async (c) => {
    await primeContext(c);
    const allowed = c.env.ALLOW_DEV_ROUTES === '1' || c.env.ALLOW_DEV_ROUTES === 'true';
    if (!allowed) {
      requireAdmin(c);
    }
    const body = await c.body<{ reset?: boolean; demo?: boolean }>();
    if (body?.reset) await wipeDemoData(c.env);
    const result = await runSeed(c.env, { demo: body?.demo !== false });
    return ok(result);
  });

  router.get('/api/admin/health', async (c) => {
    await primeContext(c);
    requireAdmin(c);
    const tables = await c.env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all<{ name: string }>();
    const bindings = {
      database: Boolean(c.env.DB),
      media: Boolean(c.env.MEDIA),
      cache: Boolean(c.env.CACHE),
      assets: Boolean(c.env.ASSETS),
      mail: Boolean(c.env.RESEND_API_KEY),
      github: Boolean(c.env.GITHUB_CLIENT_ID),
    };
    return ok({ tables: (tables.results ?? []).map((r) => r.name), bindings, environment: c.env.ENVIRONMENT ?? 'development' });
  });
}

function safeParse(value: unknown, fallback: any) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
