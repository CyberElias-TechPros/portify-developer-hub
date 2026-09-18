/**
 * Social + messaging: contact form, inbox, follows, reactions, endorsements,
 * direct messages, comment counters.
 */
import { z } from 'zod';
import type { Env } from '../env';
import type { Router } from '../lib/router';
import { HttpError, ok } from '../lib/http';
import { db, primeContext, requireUser } from '../lib/context';
import { uuid } from '../lib/crypto';
import { LIMITS, rateLimit } from '../lib/ratelimit';
import { pushActivity, pushNotification, audit } from '../lib/tables';
import { sendMail, contactNotification } from '../lib/mailer';

const REACTION_TYPES = ['like', 'love', 'celebrate', 'insightful', 'funny'] as const;

export function registerSocialRoutes(router: Router<Env>) {
  // --------------------------------------------------------- contact form --
  router.post('/api/contact', async (c) => {
    const body = z
      .object({
        name: z.string().trim().min(2, 'Please share your name').max(120),
        email: z.string().trim().toLowerCase().email('Enter a valid email address'),
        subject: z.string().trim().min(3, 'Add a subject').max(180),
        message: z.string().trim().min(10, 'Tell me a little more').max(5000),
        company: z.string().trim().max(160).optional(),
        budget: z.string().trim().max(80).optional(),
        recipient: z.string().trim().max(120).optional(),
        honeypot: z.string().max(0).optional(),
      })
      .parse(await c.body());

    await primeContext(c);
    await rateLimit(c.env, { ...LIMITS.contact, identity: c.req.headers.get('CF-Connecting-IP') || 'anon' });
    if (body.honeypot) return ok({ received: true });

    let recipientId: string | null = null;
    if (body.recipient) {
      if (body.recipient.includes('@')) {
        const row = await c.env.DB.prepare(`SELECT id FROM users WHERE lower(email) = ?`)
          .bind(body.recipient.toLowerCase())
          .first<{ id: string }>();
        recipientId = row?.id ?? null;
      } else {
        const row = await c.env.DB.prepare(`SELECT id FROM profiles WHERE lower(username) = ?`)
          .bind(body.recipient.toLowerCase())
          .first<{ id: string }>();
        recipientId = row?.id ?? null;
      }
    }

    const id = uuid();
    await c.env.DB.prepare(
      `INSERT INTO contact_messages (id, name, email, subject, message, company, budget, recipient_id, read, starred, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
    )
      .bind(
        id,
        body.name,
        body.email,
        body.subject,
        body.message,
        body.company ?? null,
        body.budget ?? null,
        recipientId,
        c.req.headers.get('CF-Connecting-IP'),
        c.req.headers.get('User-Agent'),
        new Date().toISOString()
      )
      .run();

    if (recipientId) {
      await pushNotification(
        db(c),
        recipientId,
        null,
        'message',
        'New enquiry',
        `${body.name}: ${body.subject}`,
        '/messages'
      );
      const owner = await c.env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(recipientId).first<{ email: string }>();
      if (owner?.email) {
        await sendMail(c.env, {
          to: owner.email,
          subject: `New portfolio enquiry — ${body.subject}`,
          html: contactNotification(c.env, body),
          replyTo: body.email,
        });
      }
    } else if (c.env.CONTACT_INBOX) {
      await sendMail(c.env, {
        to: c.env.CONTACT_INBOX,
        subject: `New enquiry — ${body.subject}`,
        html: contactNotification(c.env, body),
        replyTo: body.email,
      });
    }

    return ok({
      received: true,
      id,
      message: 'Message received — expect a reply within two business days.',
    }, { status: 201 });
  });

  // --------------------------------------------------------------- inbox --
  router.get('/api/messages/inbox', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const filter = c.query.get('filter') || 'all';
    const search = (c.query.get('q') || '').toLowerCase();
    const scopes: string[] = [];
    const params: unknown[] = [];

    if (db(c).isAdmin && c.query.get('scope') === 'all') {
      scopes.push('1 = 1');
    } else {
      scopes.push('recipient_id = ?');
      params.push(user.id);
    }
    if (filter === 'unread') scopes.push('read = 0');
    if (filter === 'starred') scopes.push('starred = 1');
    if (search) {
      scopes.push('(lower(name) LIKE ? OR lower(email) LIKE ? OR lower(subject) LIKE ? OR lower(message) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const rows = await c.env.DB.prepare(
      `SELECT * FROM contact_messages WHERE ${scopes.join(' AND ')} ORDER BY created_at DESC LIMIT 200`
    )
      .bind(...params)
      .all<any>();

    const messages = (rows.results ?? []).map((row: any) => ({ ...row, read: !!row.read, starred: !!row.starred }));
    return ok({
      messages,
      counts: {
        all: messages.length,
        unread: messages.filter((m: any) => !m.read).length,
        starred: messages.filter((m: any) => m.starred).length,
      },
    });
  });

  router.patch('/api/messages/:id', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const patch = z
      .object({ read: z.boolean().optional(), starred: z.boolean().optional() })
      .parse(await c.body());
    const sets: string[] = [];
    const params: unknown[] = [];
    if (patch.read !== undefined) {
      sets.push('read = ?');
      params.push(patch.read ? 1 : 0);
    }
    if (patch.starred !== undefined) {
      sets.push('starred = ?');
      params.push(patch.starred ? 1 : 0);
    }
    if (!sets.length) throw HttpError.badRequest('Nothing to update');
    const result = await c.env.DB.prepare(
      `UPDATE contact_messages SET ${sets.join(', ')} WHERE id = ? AND (recipient_id = ? OR ? = 1)`
    )
      .bind(...params, c.params.id, user.id, db(c).isAdmin ? 1 : 0)
      .run();
    if (!result.meta?.changes) throw HttpError.notFound('Message not found');
    return ok({ success: true });
  });

  router.post('/api/messages/:id/reply', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const { body: replyBody } = z.object({ body: z.string().trim().min(2).max(5000) }).parse(await c.body());
    const message = await c.env.DB.prepare(
      `SELECT * FROM contact_messages WHERE id = ? AND (recipient_id = ? OR ? = 1)`
    )
      .bind(c.params.id, user.id, db(c).isAdmin ? 1 : 0)
      .first<any>();
    if (!message) throw HttpError.notFound('Message not found');

    const sent = await sendMail(c.env, {
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `<div style="font-family:Inter,system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(replyBody)}</div>`,
    });

    await c.env.DB.prepare(`UPDATE contact_messages SET replied_at = ?, read = 1 WHERE id = ?`)
      .bind(new Date().toISOString(), message.id)
      .run();

    if (!sent) {
      const devLink = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}&body=${encodeURIComponent(replyBody)}`;
      return ok({ sent: false, dev_link: devLink, message: 'No mail provider configured — opening your mail client instead.' });
    }
    return ok({ sent: true, message: `Reply sent to ${message.email}` });
  });

  router.delete('/api/messages/:id', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const result = await c.env.DB.prepare(
      `DELETE FROM contact_messages WHERE id = ? AND (recipient_id = ? OR ? = 1)`
    )
      .bind(c.params.id, user.id, db(c).isAdmin ? 1 : 0)
      .run();
    if (!result.meta?.changes) throw HttpError.notFound('Message not found');
    return ok({ success: true });
  });

  // -------------------------------------------------------------- follows --
  router.get('/api/social/follow/:userId', async (c) => {
    await primeContext(c);
    const targetId = c.params.userId;
    const [followers, following, exists] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE following_id = ?`).bind(targetId).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE follower_id = ?`).bind(targetId).first<{ c: number }>(),
      db(c).user
        ? c.env.DB.prepare(`SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?`)
            .bind(db(c).user!.id, targetId)
            .first()
        : Promise.resolve(null),
    ]);
    return ok({ followers: followers?.c ?? 0, following: following?.c ?? 0, isFollowing: Boolean(exists) });
  });

  router.post('/api/social/follow/:userId', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const targetId = c.params.userId;
    if (targetId === user.id) throw HttpError.badRequest('You cannot follow yourself');
    const target = await c.env.DB.prepare(`SELECT id, full_name, username FROM profiles WHERE id = ?`).bind(targetId).first();
    if (!target) throw HttpError.notFound('That profile no longer exists');

    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO user_follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, ?)`
    )
      .bind(uuid(), user.id, targetId, new Date().toISOString())
      .run();

    const profile = await c.env.DB.prepare(`SELECT full_name, username FROM profiles WHERE id = ?`).bind(user.id).first<any>();
    const label = profile?.full_name || profile?.username || 'Someone';
    await pushNotification(db(c), targetId, user.id, 'follow', 'New follower', `${label} started following you`, `/${profile?.username ?? ''}`);
    await pushActivity(db(c), targetId, user.id, 'follow', 'profile', user.id, {});

    const followers = await c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE following_id = ?`)
      .bind(targetId)
      .first<{ c: number }>();
    return ok({ following: true, followers: followers?.c ?? 0 });
  });

  router.delete('/api/social/follow/:userId', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    await c.env.DB.prepare(`DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?`)
      .bind(user.id, c.params.userId)
      .run();
    const followers = await c.env.DB.prepare(`SELECT COUNT(*) AS c FROM user_follows WHERE following_id = ?`)
      .bind(c.params.userId)
      .first<{ c: number }>();
    return ok({ following: false, followers: followers?.c ?? 0 });
  });

  // ------------------------------------------------------------ reactions --
  router.get('/api/social/reactions', async (c) => {
    await primeContext(c);
    const contentType = c.query.get('content_type');
    const contentId = c.query.get('content_id');
    if (!contentType || !contentId) throw HttpError.badRequest('content_type and content_id are required');
    return ok(await reactionSummary(c.env, contentType, contentId, db(c).user?.id ?? null));
  });

  router.post('/api/social/reactions/toggle', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body = z
      .object({
        content_type: z.enum(['project', 'blog_post', 'comment', 'profile']),
        content_id: z.string().min(1),
        reaction_type: z.enum(REACTION_TYPES),
      })
      .parse(await c.body());

    const existing = await c.env.DB.prepare(
      `SELECT id FROM reactions WHERE user_id = ? AND content_type = ? AND content_id = ? AND reaction_type = ?`
    )
      .bind(user.id, body.content_type, body.content_id, body.reaction_type)
      .first<{ id: string }>();

    if (existing) {
      await c.env.DB.prepare(`DELETE FROM reactions WHERE id = ?`).bind(existing.id).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO reactions (id, user_id, content_type, content_id, reaction_type, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(uuid(), user.id, body.content_type, body.content_id, body.reaction_type, new Date().toISOString())
        .run();

      // Notify the content owner.
      const ownerId = await contentOwner(c.env, body.content_type, body.content_id);
      if (ownerId && ownerId !== user.id) {
        await pushNotification(db(c), ownerId, user.id, 'reaction', 'New reaction', `Someone reacted to your ${body.content_type.replace('_', ' ')}`, `/`);
      }
    }

    return ok(await reactionSummary(c.env, body.content_type, body.content_id, user.id));
  });

  // --------------------------------------------------------- endorsements --
  router.post('/api/social/endorse/:skillId', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const { comment } = z.object({ comment: z.string().trim().max(400).optional() }).parse((await c.body()) ?? {});
    const skill = await c.env.DB.prepare(`SELECT id, user_id, name FROM skills WHERE id = ?`).bind(c.params.skillId).first<any>();
    if (!skill) throw HttpError.notFound('Skill not found');
    if (skill.user_id === user.id) throw HttpError.badRequest('You cannot endorse your own skill');

    const existing = await c.env.DB.prepare(`SELECT id FROM skill_endorsements WHERE skill_id = ? AND endorser_id = ?`)
      .bind(skill.id, user.id)
      .first<{ id: string }>();

    if (existing) {
      await c.env.DB.prepare(`DELETE FROM skill_endorsements WHERE id = ?`).bind(existing.id).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO skill_endorsements (id, skill_id, endorser_id, comment, created_at) VALUES (?, ?, ?, ?, ?)`
      )
        .bind(uuid(), skill.id, user.id, comment ?? null, new Date().toISOString())
        .run();
      await pushNotification(db(c), skill.user_id, user.id, 'endorsement', 'New endorsement', `Someone endorsed ${skill.name}`, '/skills');
    }

    const count = await c.env.DB.prepare(`SELECT COUNT(*) AS c FROM skill_endorsements WHERE skill_id = ?`)
      .bind(skill.id)
      .first<{ c: number }>();
    await c.env.DB.prepare(`UPDATE skills SET endorsed = ? WHERE id = ?`).bind(count?.c ?? 0, skill.id).run();

    return ok({ endorsed: !existing, endorsements: count?.c ?? 0 });
  });

  router.get('/api/social/endorsements/:skillId', async (c) => {
    await primeContext(c);
    const rows = await c.env.DB.prepare(
      `SELECT e.id, e.comment, e.created_at, p.id AS user_id, p.full_name, p.username, p.avatar_url, p.title
         FROM skill_endorsements e LEFT JOIN profiles p ON p.id = e.endorser_id
        WHERE e.skill_id = ? ORDER BY e.created_at DESC LIMIT 50`
    )
      .bind(c.params.skillId)
      .all<any>();
    return ok({ endorsements: rows.results ?? [], mine: db(c).user?.id ?? null });
  });

  // ------------------------------------------------------- comment counter --
  router.get('/api/social/comments/count', async (c) => {
    const contentType = c.query.get('content_type');
    const contentId = c.query.get('content_id');
    if (!contentType || !contentId) throw HttpError.badRequest('content_type and content_id are required');
    const row = await c.env.DB.prepare(`SELECT COUNT(*) AS c FROM comments WHERE content_type = ? AND content_id = ?`)
      .bind(contentType, contentId)
      .first<{ c: number }>();
    return ok({ count: row?.c ?? 0 });
  });

  // ---------------------------------------------------- direct messaging ---
  router.get('/api/dm/threads', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const rows = await c.env.DB.prepare(
      `SELECT t.*,
              pr.id AS other_id, pr.full_name AS other_name, pr.username AS other_username, pr.avatar_url AS other_avatar,
              (SELECT body FROM direct_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT COUNT(*) FROM direct_messages m WHERE m.thread_id = t.id AND m.read_at IS NULL AND m.sender_id <> ?) AS unread
         FROM message_threads t
         LEFT JOIN profiles pr ON pr.id = CASE WHEN t.participant_a = ? THEN t.participant_b ELSE t.participant_a END
        WHERE t.participant_a = ? OR t.participant_b = ?
        ORDER BY t.last_message_at DESC LIMIT 60`
    )
      .bind(user.id, user.id, user.id, user.id)
      .all<any>();

    return ok({
      threads: (rows.results ?? []).map((row: any) => ({
        ...row,
        other: {
          id: row.other_id,
          full_name: row.other_name,
          username: row.other_username,
          avatar_url: row.other_avatar,
        },
      })),
    });
  });

  router.post('/api/dm/threads', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const { userId, subject, message } = z
      .object({
        userId: z.string().min(1),
        subject: z.string().trim().max(160).optional(),
        message: z.string().trim().min(1).max(4000).optional(),
      })
      .parse(await c.body());
    if (userId === user.id) throw HttpError.badRequest('You cannot message yourself');

    const [a, b] = [user.id, userId].sort();
    let thread = await c.env.DB.prepare(`SELECT * FROM message_threads WHERE participant_a = ? AND participant_b = ?`)
      .bind(a, b)
      .first<any>();
    const now = new Date().toISOString();
    if (!thread) {
      const id = uuid();
      await c.env.DB.prepare(
        `INSERT INTO message_threads (id, participant_a, participant_b, subject, last_message_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(id, a, b, subject ?? null, now, now)
        .run();
      thread = { id, participant_a: a, participant_b: b, subject };
    }
    if (message) {
      await c.env.DB.prepare(
        `INSERT INTO direct_messages (id, thread_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)`
      )
        .bind(uuid(), thread.id, user.id, message, now)
        .run();
      await c.env.DB.prepare(`UPDATE message_threads SET last_message_at = ? WHERE id = ?`).bind(now, thread.id).run();
      await pushNotification(db(c), userId, user.id, 'message', 'New message', message.slice(0, 80), '/messages');
    }
    return ok({ thread }, { status: 201 });
  });

  router.get('/api/dm/threads/:id', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const thread = await c.env.DB.prepare(
      `SELECT * FROM message_threads WHERE id = ? AND (participant_a = ? OR participant_b = ? OR ? = 1)`
    )
      .bind(c.params.id, user.id, user.id, db(c).isAdmin ? 1 : 0)
      .first<any>();
    if (!thread) throw HttpError.notFound('Conversation not found');

    const messages = await c.env.DB.prepare(
      `SELECT m.*, p.full_name, p.username, p.avatar_url FROM direct_messages m
         LEFT JOIN profiles p ON p.id = m.sender_id
        WHERE m.thread_id = ? ORDER BY m.created_at ASC LIMIT 300`
    )
      .bind(thread.id)
      .all<any>();

    await c.env.DB.prepare(`UPDATE direct_messages SET read_at = ? WHERE thread_id = ? AND sender_id <> ? AND read_at IS NULL`)
      .bind(new Date().toISOString(), thread.id, user.id)
      .run();

    return ok({ thread, messages: messages.results ?? [] });
  });

  router.post('/api/dm/threads/:id', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const { body } = z.object({ body: z.string().trim().min(1).max(4000) }).parse(await c.body());
    const thread = await c.env.DB.prepare(
      `SELECT * FROM message_threads WHERE id = ? AND (participant_a = ? OR participant_b = ?)`
    )
      .bind(c.params.id, user.id, user.id)
      .first<any>();
    if (!thread) throw HttpError.notFound('Conversation not found');

    const now = new Date().toISOString();
    const id = uuid();
    await c.env.DB.prepare(`INSERT INTO direct_messages (id, thread_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, thread.id, user.id, body, now)
      .run();
    await c.env.DB.prepare(`UPDATE message_threads SET last_message_at = ? WHERE id = ?`).bind(now, thread.id).run();

    const otherId = thread.participant_a === user.id ? thread.participant_b : thread.participant_a;
    await pushNotification(db(c), otherId, user.id, 'message', 'New message', body.slice(0, 80), '/messages');

    return ok({ message: { id, thread_id: thread.id, sender_id: user.id, body, created_at: now } }, { status: 201 });
  });

  // ------------------------------------------------------------ moderation --
  router.post('/api/social/report', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body = z
      .object({
        content_type: z.string().max(40),
        content_id: z.string().max(80),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(await c.body());
    await c.env.DB.prepare(
      `INSERT INTO audit_log (id, actor_id, action, target, metadata, created_at) VALUES (?, ?, 'report', ?, ?, ?)`
    )
      .bind(uuid(), user.id, `${body.content_type}:${body.content_id}`, JSON.stringify({ reason: body.reason }), new Date().toISOString())
      .run();
    return ok({ reported: true, message: 'Thanks — our moderators will take a look.' });
  });

  router.get('/api/social/pending-testimonials', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const rows = await c.env.DB.prepare(
      `SELECT t.*, p.full_name, p.username, p.avatar_url FROM testimonials t
         LEFT JOIN profiles p ON p.id = t.author_id
        WHERE t.user_id = ? AND t.approved = 0 ORDER BY t.created_at DESC`
    )
      .bind(user.id)
      .all<any>();
    return ok({ testimonials: rows.results ?? [] });
  });
}

async function reactionSummary(env: Env, contentType: string, contentId: string, userId: string | null) {
  const rows = await env.DB.prepare(
    `SELECT reaction_type, COUNT(*) AS count FROM reactions WHERE content_type = ? AND content_id = ?
      GROUP BY reaction_type`
  )
    .bind(contentType, contentId)
    .all<{ reaction_type: string; count: number }>();

  const summary: Record<string, number> = {};
  for (const type of REACTION_TYPES) summary[type] = 0;
  for (const row of rows.results ?? []) summary[row.reaction_type] = row.count;

  let mine: string[] = [];
  if (userId) {
    const mineRows = await env.DB.prepare(
      `SELECT reaction_type FROM reactions WHERE user_id = ? AND content_type = ? AND content_id = ?`
    )
      .bind(userId, contentType, contentId)
      .all<{ reaction_type: string }>();
    mine = (mineRows.results ?? []).map((r) => r.reaction_type);
  }

  return { summary, mine, total: Object.values(summary).reduce((a, b) => a + b, 0) };
}

async function contentOwner(env: Env, contentType: string, contentId: string): Promise<string | null> {
  const table = contentType === 'project' ? 'projects' : contentType === 'blog_post' ? 'blog_posts' : contentType === 'comment' ? 'comments' : 'profiles';
  const column = table === 'profiles' ? 'id' : 'id';
  const row = await env.DB.prepare(`SELECT user_id FROM ${table} WHERE ${column} = ?`).bind(contentId).first<{ user_id: string }>();
  return row?.user_id ?? null;
}

function escapeHtml(value: string) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
