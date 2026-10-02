/**
 * WebCrypto primitives: PBKDF2 password hashing, session tokens, HMAC signing.
 * No external dependencies — runs natively on workerd.
 */

const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toBase64Url(buf);
}

export function uuid(): string {
  return crypto.randomUUID();
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface PasswordHash {
  hash: string;
  salt: string;
  iterations: number;
}

const DEFAULT_ITERATIONS = 100_000;
const MIN_ITERATIONS = 1_000;
const MAX_ITERATIONS = 100_000;

function clampIterations(iterations: number): number {
  if (!Number.isFinite(iterations)) return DEFAULT_ITERATIONS;
  return Math.min(Math.max(Math.trunc(iterations), MIN_ITERATIONS), MAX_ITERATIONS);
}

export async function hashPassword(password: string, iterations = DEFAULT_ITERATIONS): Promise<PasswordHash> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = toBase64Url(saltBytes);
  const hash = await pbkdf2(password, saltBytes, iterations);
  return { hash, salt, iterations };
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  if (!stored?.hash || !stored?.salt) return false;
  try {
    const hash = await pbkdf2(password, fromBase64Url(stored.salt), stored.iterations || DEFAULT_ITERATIONS);
    return timingSafeEqual(hash, stored.hash);
  } catch {
    return false;
  }
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: clampIterations(iterations), hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toBase64Url(new Uint8Array(bits));
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Stateless signed payload (used for OAuth `state` and one-time links). */
export async function signPayload(secret: string, payload: Record<string, unknown>, ttlSeconds = 600): Promise<string> {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = toBase64Url(enc.encode(JSON.stringify(body)));
  const sig = await hmacHex(secret, data);
  return `${data}.${sig}`;
}

export async function verifyPayload<T = Record<string, unknown>>(secret: string, token: string): Promise<T | null> {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = await hmacHex(secret, data);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(fromBase64Url(data)));
    if (typeof json.exp === 'number' && json.exp < Math.floor(Date.now() / 1000)) return null;
    return json as T;
  } catch {
    return null;
  }
}
