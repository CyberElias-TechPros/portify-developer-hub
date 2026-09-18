/**
 * Authentication: email+password, opaque sessions, password reset, GitHub OAuth.
 */
import { z } from 'zod';
import type { Env } from '../env';
import type { Router, RouteContext } from '../lib/router';
import { HttpError, clientIp, json, ok, serialiseCookie, userAgentInfo } from '../lib/http';
import { hashPassword, randomToken, sha256Hex, signPayload, uuid, verifyPassword, verifyPayload } from '../lib/crypto';
import {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  createSession,
  ensureProfileExists,
  extractToken,
  loadRoles,
  requireUser,
  resolveSession,
  revokeAllSessions,
  revokeSession,
  toDBContext,
} from '../lib/auth';
import { LIMITS, rateLimit } from '../lib/ratelimit';
import { sendMail } from '../lib/mailer';
import { audit } from '../lib/tables';

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{3,30}$/, 'Usernames use 3–30 letters, numbers, dashes or underscores');

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().trim().max(120).optional(),
  username: usernameSchema.optional(),
});

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password') });

function sessionCookie(env: Env, token: string, expiresAt: string, url: URL): string {
  return serialiseCookie(SESSION_COOKIE, token, {
    maxAge: SESSION_TTL_DAYS * 86400,
    secure: url.protocol === 'https:',
    sameSite: 'Lax',
  });
}

function clearCookie(url: URL): string {
  return serialiseCookie(SESSION_COOKIE, '', { maxAge: 0, secure: url.protocol === 'https:', sameSite: 'Lax' });
}

export async function currentUserPayload(env: Env, userId: string, email: string) {
  const [profile, roles] = await Promise.all([
    env.DB.prepare(`SELECT * FROM profiles WHERE id = ?`).bind(userId).first<any>(),
    loadRoles(env, userId),
  ]);
  return {
    id: userId,
    email,
    roles,
    user_metadata: {
      full_name: profile?.full_name ?? null,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      username: profile?.username ?? null,
      title: profile?.title ?? null,
    },
    app_metadata: { provider: 'password', roles },
    profile: profile ? mapProfile(profile) : null,
  };
}

export function mapProfile(row: any) {
  if (!row) return null;
  const parsed = { ...row };
  for (const key of ['is_public', 'is_verified']) {
    if (key in parsed) parsed[key] = !!parsed[key];
  }
  return parsed;
}

export function registerAuthRoutes(router: Router<Env>) {
  router.get('/api/auth/providers', (c) =>
    ok({
      email: true,
      github: Boolean(c.env.GITHUB_CLIENT_ID && c.env.GITHUB_CLIENT_SECRET),
      publicSignups: c.env.PUBLIC_SIGNUPS !== '0' && c.env.PUBLIC_SIGNUPS !== 'false',
      verificationRequired:
        c.env.REQUIRE_EMAIL_VERIFICATION === '1' || c.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    })
  );

  // ---------------------------------------------------------------- signup --
  router.post('/api/auth/signup', async (c) => {
    if (c.env.PUBLIC_SIGNUPS === '0' || c.env.PUBLIC_SIGNUPS === 'false') {
      throw HttpError.forbidden('Sign-ups are currently closed');
    }
    const body = signupSchema.parse(await c.body());
    await rateLimit(c.env, { ...LIMITS.signup, identity: clientIp(c.req) });

    const existing = await c.env.DB.prepare(`SELECT id FROM users WHERE lower(email) = ?`).bind(body.email).first();
    if (existing) throw HttpError.conflict('An account with this email already exists — try signing in instead.');

    if (body.username) {
      const taken = await c.env.DB.prepare(`SELECT id FROM profiles WHERE lower(username) = ?`)
        .bind(body.username.toLowerCase())
        .first();
      if (taken) throw HttpError.conflict('That username is already taken');
    }

    const { hash, salt, iterations } = await hashPassword(body.password);
    const userId = uuid();
    const now = new Date().toISOString();
    const requiresVerification =
      c.env.REQUIRE_EMAIL_VERIFICATION === '1' || c.env.REQUIRE_EMAIL_VERIFICATION === 'true';

    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, password_iter, provider, email_verified, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'password', ?, 1, ?, ?)`
    )
      .bind(userId, body.email, hash, salt, iterations, requiresVerification ? 0 : 1, now, now)
      .run();

    await ensureProfileExists(c.env, userId, body.email, { full_name: body.full_name });

    if (body.username) {
      await c.env.DB.prepare(`UPDATE profiles SET username = ? WHERE id = ?`).bind(body.username, userId).run();
      await c.env.DB.prepare(
        `INSERT INTO usernames (id, user_id, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
      )
        .bind(uuid(), userId, body.username, now, now)
        .run();
    }

    await audit({ env: c.env, user: { id: userId, email: body.email, roles: ['user'] }, isAdmin: false }, 'auth.signup', userId, {
      ip: clientIp(c.req),
    });

    if (requiresVerification) {
      const token = randomToken(24);
      await c.env.DB.prepare(
        `INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at, created_at) VALUES (?, ?, 'email_verify', ?, ?, ?)`
      )
        .bind(uuid(), userId, await sha256Hex(token), new Date(Date.now() + 864e5).toISOString(), now)
        .run();
      await sendMail(c.env, {
        to: body.email,
        subject: 'Verify your Portify account',
        html: verificationEmail(c.env, token),
      });
      return ok({
        user: null,
        session: null,
        verificationRequired: true,
        message: 'Check your inbox to verify your email address.',
      });
    }

    const session = await createSession(c.env, userId, { ip: clientIp(c.req), userAgent: c.req.headers.get('User-Agent') });
    const payload = await currentUserPayload(c.env, userId, body.email);
    return ok(
      {
        user: payload,
        session: { access_token: session.token, expires_at: session.expiresAt, user: payload },
        message: 'Welcome to Portify!',
      },
      { headers: { 'Set-Cookie': sessionCookie(c.env, session.token, session.expiresAt, c.url) } }
    );
  });

  // ----------------------------------------------------------------- login --
  router.post('/api/auth/login', async (c) => {
    const body = loginSchema.parse(await c.body());
    await rateLimit(c.env, { ...LIMITS.login, identity: `${clientIp(c.req)}:${body.email}` });

    const user = await c.env.DB.prepare(
      `SELECT id, email, password_hash, password_salt, password_iter, is_active, email_verified FROM users WHERE lower(email) = ?`
    )
      .bind(body.email)
      .first<any>();

    const invalid = () => new HttpError(401, 'Incorrect email or password', 'invalid_credentials');
    if (!user || !user.is_active) throw invalid();

    const valid = await verifyPassword(body.password, {
      hash: user.password_hash,
      salt: user.password_salt,
      iterations: user.password_iter,
    });
    if (!valid) throw invalid();

    await c.env.DB.prepare(`UPDATE users SET last_sign_in_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), user.id)
      .run();

    const session = await createSession(c.env, user.id, {
      ip: clientIp(c.req),
      userAgent: c.req.headers.get('User-Agent'),
    });
    const payload = await currentUserPayload(c.env, user.id, user.email);
    return ok(
      { user: payload, session: { access_token: session.token, expires_at: session.expiresAt, user: payload } },
      { headers: { 'Set-Cookie': sessionCookie(c.env, session.token, session.expiresAt, c.url) } }
    );
  });

  // ---------------------------------------------------------------- logout --
  router.post('/api/auth/logout', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (session) await revokeSession(c.env, session.sessionId);
    return ok({ success: true }, { headers: { 'Set-Cookie': clearCookie(c.url) } });
  });

  // --------------------------------------------------------------- session --
  router.get('/api/auth/session', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (!session) return ok({ user: null, session: null });
    const payload = await currentUserPayload(c.env, session.user.id, session.user.email);
    return ok({
      user: payload,
      session: { access_token: extractToken(c.req), expires_at: session.expiresAt, user: payload },
    });
  });

  // --------------------------------------------------------------- refresh --
  router.post('/api/auth/refresh', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (!session) throw HttpError.unauthorized('Session expired — please sign in again');
    await revokeSession(c.env, session.sessionId);
    const rotated = await createSession(c.env, session.user.id, {
      ip: clientIp(c.req),
      userAgent: c.req.headers.get('User-Agent'),
    });
    return ok(
      { access_token: rotated.token, expires_at: rotated.expiresAt },
      { headers: { 'Set-Cookie': sessionCookie(c.env, rotated.token, rotated.expiresAt, c.url) } }
    );
  });

  // ------------------------------------------------------- password: forgot --
  router.post('/api/auth/password/forgot', async (c) => {
    const { email } = z.object({ email: emailSchema }).parse(await c.body());
    await rateLimit(c.env, { ...LIMITS.passwordReset, identity: `${clientIp(c.req)}:${email}` });

    const user = await c.env.DB.prepare(`SELECT id, email FROM users WHERE lower(email) = ?`).bind(email).first<any>();
    const generic = { message: 'If an account exists for that address, a reset link is on its way.' };
    if (!user) return ok(generic);

    const token = randomToken(24);
    await c.env.DB.prepare(
      `INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at, created_at) VALUES (?, ?, 'password_reset', ?, ?, ?)`
    )
      .bind(uuid(), user.id, await sha256Hex(token), new Date(Date.now() + 36e5).toISOString(), new Date().toISOString())
      .run();

    const link = `${c.env.APP_URL || c.url.origin}/auth/reset-password?token=${token}`;
    const sent = await sendMail(c.env, {
      to: user.email,
      subject: 'Reset your Portify password',
      html: resetEmail(link),
    });

    const devTokens = c.env.DEV_RETURN_TOKENS !== '0' && c.env.DEV_RETURN_TOKENS !== 'false';
    return ok({
      ...generic,
      ...(devTokens && !sent ? { dev_token: token, dev_link: link, note: 'No mail provider configured — use dev_link.' } : {}),
    });
  });

  // -------------------------------------------------------- password: reset --
  router.post('/api/auth/password/reset', async (c) => {
    const body = z
      .object({ token: z.string().min(10, 'Reset token required'), password: passwordSchema })
      .parse(await c.body());

    const tokenHash = await sha256Hex(body.token);
    const record = await c.env.DB.prepare(
      `SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token_hash = ? AND kind = 'password_reset'`
    )
      .bind(tokenHash)
      .first<any>();

    if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
      throw HttpError.badRequest('This reset link is invalid or has expired');
    }

    const { hash, salt, iterations } = await hashPassword(body.password);
    await c.env.DB.prepare(
      `UPDATE users SET password_hash = ?, password_salt = ?, password_iter = ?, updated_at = ? WHERE id = ?`
    )
      .bind(hash, salt, iterations, new Date().toISOString(), record.user_id)
      .run();
    await c.env.DB.prepare(`UPDATE auth_tokens SET used_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), record.id)
      .run();
    await revokeAllSessions(c.env, record.user_id);

    return ok({ message: 'Password updated — you can sign in now.' });
  });

  // ------------------------------------------------------- password: change --
  router.post('/api/auth/password/change', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (!session) throw HttpError.unauthorized();
    const body = z
      .object({ current_password: z.string().min(1), new_password: passwordSchema })
      .parse(await c.body());

    const user = await c.env.DB.prepare(
      `SELECT password_hash, password_salt, password_iter FROM users WHERE id = ?`
    )
      .bind(session.user.id)
      .first<any>();

    const valid = await verifyPassword(body.current_password, {
      hash: user?.password_hash ?? '',
      salt: user?.password_salt ?? '',
      iterations: user?.password_iter ?? 210000,
    });
    if (!valid) throw HttpError.badRequest('Your current password is incorrect');

    const { hash, salt, iterations } = await hashPassword(body.new_password);
    await c.env.DB.prepare(
      `UPDATE users SET password_hash = ?, password_salt = ?, password_iter = ?, updated_at = ? WHERE id = ?`
    )
      .bind(hash, salt, iterations, new Date().toISOString(), session.user.id)
      .run();
    await revokeAllSessions(c.env, session.user.id, session.sessionId);
    return ok({ message: 'Password updated successfully' });
  });

  // ------------------------------------------------------------ email verify --
  router.post('/api/auth/verify-email', async (c) => {
    const { token } = z.object({ token: z.string().min(10) }).parse(await c.body());
    const tokenHash = await sha256Hex(token);
    const record = await c.env.DB.prepare(
      `SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token_hash = ? AND kind = 'email_verify'`
    )
      .bind(tokenHash)
      .first<any>();
    if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
      throw HttpError.badRequest('This verification link is invalid or has expired');
    }
    await c.env.DB.prepare(`UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), record.user_id)
      .run();
    await c.env.DB.prepare(`UPDATE auth_tokens SET used_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), record.id)
      .run();
    const session = await createSession(c.env, record.user_id);
    return ok(
      { verified: true, access_token: session.token },
      { headers: { 'Set-Cookie': sessionCookie(c.env, session.token, session.expiresAt, c.url) } }
    );
  });

  // ------------------------------------------------------------------ OAuth --
  router.get('/api/auth/oauth/:provider', async (c) => {
    const provider = c.params.provider;
    if (provider !== 'github') throw HttpError.badRequest('Unsupported identity provider');
    if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET) {
      throw new HttpError(501, 'GitHub sign-in is not configured on this deployment', 'provider_unavailable');
    }
    const redirectUri = `${c.url.origin}/api/auth/oauth/github/callback`;
    const state = await signPayload(c.env.SESSION_SECRET || 'portify-dev-secret', {
      next: c.query.get('next') || '/profile',
      ref: clientIp(c.req),
    });
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', c.env.GITHUB_CLIENT_ID);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('scope', 'read:user user:email');
    authorize.searchParams.set('state', state);
    return Response.redirect(authorize.toString(), 302);
  });

  router.get('/api/auth/oauth/github/callback', async (c) => {
    const code = c.query.get('code');
    const state = c.query.get('state');
    if (!code) throw HttpError.badRequest('Missing OAuth code');
    const decoded = state ? await verifyPayload<{ next?: string }>(c.env.SESSION_SECRET || 'portify-dev-secret', state) : null;
    const next = decoded?.next || '/profile';

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${c.url.origin}/api/auth/oauth/github/callback`,
      }),
    });
    const tokenJson: any = await tokenResponse.json();
    if (!tokenJson.access_token) throw HttpError.badRequest('GitHub rejected the sign-in attempt');

    const ghHeaders = {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portify-worker',
    };
    const [profileRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const ghUser: any = await profileRes.json();
    const emails: any[] = emailRes.ok ? await emailRes.json() : [];
    const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
    const email = (primary?.email || ghUser.email || '').toLowerCase();
    if (!email) throw HttpError.badRequest('Your GitHub account has no verified email address');

    let user = await c.env.DB.prepare(`SELECT id, email FROM users WHERE lower(email) = ? OR (provider = 'github' AND provider_id = ?)`)
      .bind(email, String(ghUser.id))
      .first<any>();
    const now = new Date().toISOString();

    if (!user) {
      const userId = uuid();
      await c.env.DB.prepare(
        `INSERT INTO users (id, email, provider, provider_id, email_verified, is_active, metadata, created_at, updated_at)
         VALUES (?, ?, 'github', ?, 1, 1, ?, ?, ?)`
      )
        .bind(userId, email, String(ghUser.id), JSON.stringify({ login: ghUser.login }), now, now)
        .run();
      await ensureProfileExists(c.env, userId, email, {
        full_name: ghUser.name || ghUser.login,
        avatar_url: ghUser.avatar_url,
        bio: ghUser.bio,
        location: ghUser.location,
        title: ghUser.company || 'Developer',
      });
      await c.env.DB.prepare(
        `UPDATE profiles SET github = ?, username = COALESCE(username, ?), avatar_url = COALESCE(?, avatar_url), updated_at = ? WHERE id = ?`
      )
        .bind(ghUser.html_url, ghUser.login?.slice(0, 30), ghUser.avatar_url, now, userId)
        .run();
      user = { id: userId, email };
    } else {
      await c.env.DB.prepare(`UPDATE users SET last_sign_in_at = ?, provider_id = ? WHERE id = ?`)
        .bind(now, String(ghUser.id), user.id)
        .run();
    }

    const session = await createSession(c.env, user.id, { ip: clientIp(c.req), userAgent: c.req.headers.get('User-Agent') });
    const destination = new URL(next.startsWith('/') ? next : '/profile', c.env.APP_URL || c.url.origin);
    destination.searchParams.set('token', session.token);
    return new Response(null, {
      status: 302,
      headers: {
        Location: destination.toString(),
        'Set-Cookie': sessionCookie(c.env, session.token, session.expiresAt, c.url),
      },
    });
  });

  // ---------------------------------------------------------------- devices --
  router.get('/api/auth/sessions', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (!session) throw HttpError.unauthorized();
    const result = await c.env.DB.prepare(
      `SELECT id, user_agent, ip, created_at, expires_at FROM sessions
        WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 25`
    )
      .bind(session.user.id, new Date().toISOString())
      .all();
    return ok({ sessions: result.results ?? [], current: session.sessionId });
  });

  router.delete('/api/auth/sessions/:id', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (!session) throw HttpError.unauthorized();
    await c.env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ? AND user_id = ?`)
      .bind(new Date().toISOString(), c.params.id, session.user.id)
      .run();
    return ok({ success: true });
  });

  router.post('/api/auth/logout-all', async (c) => {
    const session = await resolveSession(c.req, c.env);
    if (!session) throw HttpError.unauthorized();
    await revokeAllSessions(c.env, session.user.id);
    return ok({ success: true }, { headers: { 'Set-Cookie': clearCookie(c.url) } });
  });
}

function resetEmail(link: string) {
  return `<div style="font-family:Inter,system-ui,sans-serif;background:#07070c;color:#e9e9f2;padding:32px;border-radius:20px">
    <h1 style="margin:0 0 8px">Reset your password</h1>
    <p style="color:#a5a5bd">Tap the button below to choose a new password. This link expires in one hour.</p>
    <p><a href="${link}" style="display:inline-block;background:#7c5cff;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Choose a new password</a></p>
    <p style="color:#6f6f8a;font-size:12px">If you didn't request this, you can safely ignore the email.</p>
  </div>`;
}

function verificationEmail(env: Env, token: string) {
  const link = `${env.APP_URL || ''}/auth/verify?token=${token}`;
  return `<div style="font-family:Inter,system-ui,sans-serif">
    <h1>Confirm your email</h1>
    <p>Welcome to Portify. Confirm your address to activate your portfolio:</p>
    <p><a href="${link}">Verify email</a></p>
  </div>`;
}

export function authRoutesMeta() {
  return { name: 'auth' };
}

export async function attachUser(c: RouteContext<Env>) {
  const session = await resolveSession(c.req, c.env);
  c.state.session = session;
  return toDBContext(c.env, session, c.req);
}

export type { RouteContext };
export { json };
export { requireUser };
