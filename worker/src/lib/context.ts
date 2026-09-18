/**
 * Request-scoped helpers: resolves the caller once per request and exposes
 * the DB context every route needs.
 */
import type { Env } from '../env';
import type { RouteContext } from './router';
import { HttpError } from './http';
import { resolveSession, toDBContext, type ResolvedSession } from './auth';
import type { DBContext, SessionUser } from './tables';

export async function primeContext(c: RouteContext<Env>): Promise<void> {
  if (c.state.db) return;
  const session = await resolveSession(c.req, c.env);
  c.state.session = session;
  c.state.db = toDBContext(c.env, session, c.req);
}

export function db(c: RouteContext<Env>): DBContext {
  return (c.state.db as DBContext) ?? { env: c.env, user: null, isAdmin: false };
}

export function session(c: RouteContext<Env>): ResolvedSession | null {
  return (c.state.session as ResolvedSession | null) ?? null;
}

export function requireUser(c: RouteContext<Env>): SessionUser {
  const context = db(c);
  if (!context.user) throw HttpError.unauthorized();
  return context.user;
}

export function requireAdmin(c: RouteContext<Env>): SessionUser {
  const user = requireUser(c);
  if (!db(c).isAdmin) throw HttpError.forbidden('Administrator access required');
  return user;
}

export function clientIpOf(c: RouteContext<Env>): string {
  return (
    c.req.headers.get('CF-Connecting-IP') ||
    c.req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  );
}
