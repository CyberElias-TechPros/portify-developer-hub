/**
 * HTTP helpers: JSON responses, typed errors, CORS, cookies, security headers.
 */
export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Invalid request', details?: unknown) {
    return new HttpError(400, message, 'bad_request', details);
  }
  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, message, 'unauthorized');
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new HttpError(403, message, 'forbidden');
  }
  static notFound(message = 'Not found') {
    return new HttpError(404, message, 'not_found');
  }
  static conflict(message = 'Resource already exists') {
    return new HttpError(409, message, 'conflict');
  }
  static tooMany(message = 'Too many requests — slow down a moment') {
    return new HttpError(429, message, 'rate_limited');
  }
  static server(message = 'Something went wrong on our side') {
    return new HttpError(500, message, 'server_error');
  }
}

export const CORS_HEADERS = (origin: string | null, credentials = true): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, X-Client-Info, Accept, Prefer, Range',
  'Access-Control-Expose-Headers': 'Content-Range, X-Total-Count',
  'Access-Control-Max-Age': '86400',
  ...(credentials ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
  Vary: 'Origin',
});

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
};

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', headers.get('Cache-Control') || 'no-store');
  return new Response(JSON.stringify(data ?? null), { ...init, headers });
}

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  return json({ data, error: null }, init);
}

export function fail(error: unknown): Response {
  // Zod validation errors → friendly field-level messages.
  const maybeZod = error as { name?: string; issues?: Array<{ path?: (string | number)[]; message?: string }> };
  if (maybeZod?.name === 'ZodError' && Array.isArray(maybeZod.issues)) {
    return json(
      {
        data: null,
        error: {
          message: maybeZod.issues[0]?.message ?? 'Some fields need your attention',
          code: 'validation_error',
          details: maybeZod.issues.map((issue) => ({
            path: (issue.path ?? []).join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    );
  }
  if (error instanceof HttpError) {
    return json({ data: null, error: { message: error.message, code: error.code, details: error.details } }, {
      status: error.status,
    });
  }
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return json({ data: null, error: { message, code: 'server_error' } }, { status: 500 });
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function serialiseCookie(
  name: string,
  value: string,
  opts: { maxAge?: number; secure?: boolean; path?: string; sameSite?: 'Lax' | 'Strict' | 'None' } = {}
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? '/'}`);
  parts.push(`SameSite=${opts.sameSite ?? 'Lax'}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.secure) parts.push('Secure');
  parts.push('HttpOnly');
  return parts.join('; ');
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('CF-Connecting-IP') ||
    req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.headers.get('X-Real-IP') ||
    '0.0.0.0'
  );
}

export function userAgentInfo(req: Request) {
  const ua = req.headers.get('User-Agent') || '';
  const device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';
  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /chrome|crios/i.test(ua)
      ? 'Chrome'
      : /safari/i.test(ua)
        ? 'Safari'
        : /firefox/i.test(ua)
          ? 'Firefox'
          : 'Other';
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /mac os|macintosh/i.test(ua)
      ? 'macOS'
      : /android/i.test(ua)
        ? 'Android'
        : /iphone|ipad|ios/i.test(ua)
          ? 'iOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'Other';
  return { device, browser, os };
}

/** Normalises a path into a safe, canonical form. */
export function normalisePath(path: string): string {
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  return p.replace(/\/+$/, '') || '/';
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}
