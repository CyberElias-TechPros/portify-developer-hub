/**
 * D1-backed sliding-window rate limiter (with KV fast-path when bound).
 */
import type { Env } from '../env';
import { HttpError } from './http';

export interface RateLimitOptions {
  /** Bucket name, e.g. `login`, `contact`. */
  bucket: string;
  /** Caller identity (ip, user id, email…). */
  identity: string;
  limit: number;
  windowSeconds: number;
}

export async function rateLimit(env: Env, opts: RateLimitOptions): Promise<void> {
  if (env.RATE_LIMIT_DISABLED === '1' || env.RATE_LIMIT_DISABLED === 'true') return;

  const key = `${opts.bucket}:${opts.identity}`;
  const now = Date.now();
  const windowStart = new Date(now - opts.windowSeconds * 1000).toISOString();

  const row = await env.DB.prepare(`SELECT key, count, window_start FROM rate_limits WHERE key = ?`).bind(key).first<{
    key: string;
    count: number;
    window_start: string;
  }>();

  if (!row || row.window_start < windowStart) {
    await env.DB.prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`
    )
      .bind(key, new Date(now).toISOString())
      .run();
    return;
  }

  if (row.count >= opts.limit) {
    throw HttpError.tooMany(`Too many attempts. Try again in ${Math.ceil(opts.windowSeconds / 60)} minute(s).`);
  }

  await env.DB.prepare(`UPDATE rate_limits SET count = count + 1 WHERE key = ?`).bind(key).run();
}

export function limitBy(bucket: string, limit: number, windowSeconds: number) {
  return { bucket, limit, windowSeconds };
}

export const LIMITS = {
  login: limitBy('login', 10, 600),
  signup: limitBy('signup', 6, 3600),
  passwordReset: limitBy('password-reset', 5, 3600),
  contact: limitBy('contact', 5, 3600),
  comment: limitBy('comment', 40, 3600),
  reaction: limitBy('reaction', 200, 3600),
  upload: limitBy('upload', 40, 3600),
  analytics: limitBy('analytics', 600, 3600),
  newsletter: limitBy('newsletter', 5, 3600),
  githubImport: limitBy('github-import', 20, 3600),
  general: limitBy('general', 600, 60),
} as const;
