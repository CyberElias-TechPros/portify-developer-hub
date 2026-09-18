/**
 * Session management: opaque bearer tokens (+ HttpOnly cookie) persisted in D1.
 */
import type { Env, Role } from '../env';
import { clientIp, HttpError } from './http';
import { randomToken, sha256Hex, uuid } from './crypto';
import type { DBContext, SessionUser } from './tables';

export const SESSION_COOKIE = 'portify_session';
export const SESSION_TTL_DAYS = 30;

export interface CreateSessionOptions {
  userAgent?: string | null;
  ip?: string | null;
}

export async function createSession(env: Env, userId: string, opts: CreateSessionOptions = {}) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 864e5).toISOString();
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, userId, tokenHash, opts.userAgent ?? null, opts.ip ?? null, expiresAt, new Date().toISOString())
    .run();
  return { id, token, expiresAt };
}

export interface ResolvedSession {
  user: SessionUser;
  sessionId: string;
  expiresAt: string;
}

export async function resolveSession(req: Request, env: Env): Promise<ResolvedSession | null> {
  const token = extractToken(req);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.expires_at, s.revoked_at, u.id, u.email, u.is_active, u.metadata
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? LIMIT 1`
  )
    .bind(tokenHash)
    .first<{
      session_id: string;
      expires_at: string;
      revoked_at: string | null;
      id: string;
      email: string;
      is_active: number;
      metadata: string | null;
    }>();

  if (!row || row.revoked_at || !row.is_active) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  const roles = await loadRoles(env, row.id);
  return {
    user: { id: row.id, email: row.email, roles },
    sessionId: row.session_id,
    expiresAt: row.expires_at,
  };
}

export function extractToken(req: Request): string | null {
  const header = req.headers.get('Authorization');
  if (header?.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  const cookieHeader = req.headers.get('Cookie');
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function loadRoles(env: Env, userId: string): Promise<Role[]> {
  const result = await env.DB.prepare(`SELECT role FROM user_roles WHERE user_id = ?`).bind(userId).all<{ role: Role }>();
  const roles = (result.results ?? []).map((r) => r.role);
  return roles.length ? roles : ['user'];
}

export async function revokeSession(env: Env, sessionId: string) {
  await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`).bind(new Date().toISOString(), sessionId).run();
}

export async function revokeAllSessions(env: Env, userId: string, exceptSessionId?: string) {
  const now = new Date().toISOString();
  if (exceptSessionId) {
    await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id <> ?`).bind(now, userId, exceptSessionId).run();
  } else {
    await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ?`).bind(now, userId).run();
  }
}

export function toDBContext(env: Env, session: ResolvedSession | null, req: Request): DBContext {
  return {
    env,
    user: session?.user ?? null,
    isAdmin: session?.user.roles.includes('admin') ?? false,
  };
}

export function requireUser(ctx: DBContext): SessionUser {
  if (!ctx.user) throw HttpError.unauthorized();
  return ctx.user;
}

export function requireAdmin(ctx: DBContext): SessionUser {
  const user = requireUser(ctx);
  if (!ctx.isAdmin) throw HttpError.forbidden('Administrator access required');
  return user;
}

export async function ensureProfileExists(env: Env, userId: string, email: string, meta: Record<string, any> = {}) {
  const existing = await env.DB.prepare(`SELECT id FROM profiles WHERE id = ?`).bind(userId).first();
  if (existing) return;
  const now = new Date().toISOString();
  const fallbackName = meta.full_name || meta.name || email.split('@')[0];
  await env.DB.prepare(
    `INSERT INTO profiles (id, full_name, display_name, email, title, bio, location, avatar_url, is_public, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(
      userId,
      fallbackName,
      fallbackName,
      email,
      meta.title || 'Developer',
      meta.bio || '',
      meta.location || '',
      meta.avatar_url || null,
      now,
      now
    )
    .run();
  await env.DB.prepare(`INSERT OR IGNORE INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'user', ?)`)
    .bind(uuid(), userId, now)
    .run();
  await seedStarterContent(env, userId);
}

/** Gives every new account a working, non-empty portfolio. */
export async function seedStarterContent(env: Env, userId: string) {
  const now = new Date().toISOString();
  const sections: Array<[string, string, string, number]> = [
    ['hero', 'Introduction', 'The headline, avatar and calls to action.', 0],
    ['about', 'About me', 'A short story about what you do and how you work.', 1],
    ['projects', 'Selected work', 'Case studies with outcomes, not just screenshots.', 2],
    ['skills', 'Capabilities', 'Tools, languages and platforms you work with.', 3],
    ['experience', 'Experience', 'Roles, impact and the teams behind them.', 4],
    ['blog', 'Writing', 'Notes, deep dives and build logs.', 5],
    ['contact', 'Get in touch', 'A direct line for collaboration and opportunities.', 6],
  ];
  const stmt = env.DB.prepare(
    `INSERT INTO portfolio_sections (id, user_id, type, title, subtitle, content, visible, position_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '{}', 1, ?, ?, ?)`
  );
  for (const [type, title, subtitle, position] of sections) {
    await stmt.bind(uuid(), userId, type, title, subtitle, position, now, now).run();
  }
  await env.DB.prepare(
    `INSERT INTO themes (id, user_id, name, config, is_active, created_at, updated_at) VALUES (?, ?, 'Cinematic', ?, 1, ?, ?)`
  )
    .bind(
      uuid(),
      userId,
      JSON.stringify({
        accent: '#7c5cff',
        secondary: '#22d3ee',
        typography: 'sora',
        layout: 'immersive',
        darkMode: true,
        radius: 1.25,
        motion: 'cinematic',
      }),
      now,
      now
    )
    .run();
  await env.DB.prepare(
    `INSERT INTO resumes (id, user_id, name, template, content, is_default, created_at, updated_at)
     VALUES (?, ?, 'My Resume', 'modern', '{}', 1, ?, ?)`
  )
    .bind(uuid(), userId, now, now)
    .run();
}

export function ipAndAgent(req: Request) {
  return { ip: clientIp(req), userAgent: req.headers.get('User-Agent') };
}
