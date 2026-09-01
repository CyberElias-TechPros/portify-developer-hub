import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";

interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  GITHUB_TOKEN?: string;
  ADMIN_BOOTSTRAP_TOKEN?: string;
  SESSION_COOKIE_DOMAIN?: string;
  ENVIRONMENT?: string;
}

type Role = "admin" | "moderator" | "user";
type Row = Record<string, unknown>;
type AuthUser = {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  role: Role;
};
type AuthContext = { user: AuthUser; isAdmin: boolean };
type FilterValue = string | number | boolean | null;
type Filter =
  | { kind: "eq"; field: string; value: FilterValue }
  | { kind: "in"; field: string; values: Array<string | number | boolean> }
  | { kind: "not"; field: string; operator: "is" | "neq"; value: FilterValue };

type TableConfig = {
  columns: string[];
  owner?: string;
  public: boolean;
  publicColumns?: string[];
};

const SESSION_COOKIE = "portify_session";
const SESSION_DAYS = 30;
const MAX_BODY_BYTES = 1_500_000;
const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:4173", "http://localhost:8080"];
const tableConfig: Record<string, TableConfig> = {
  profiles: {
    columns: ["id", "full_name", "title", "bio", "location", "email", "phone", "github", "linkedin", "twitter", "website", "avatar_url", "created_at", "updated_at"],
    owner: "id",
    public: true,
    publicColumns: ["id", "full_name", "title", "bio", "location", "github", "linkedin", "twitter", "website", "avatar_url", "created_at", "updated_at"],
  },
  usernames: {
    columns: ["id", "user_id", "username", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  projects: {
    columns: ["id", "user_id", "title", "description", "long_description", "tags", "image_url", "repo_url", "demo_url", "featured", "stars", "forks", "contributors", "category", "is_public", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  skills: {
    columns: ["id", "user_id", "name", "category", "proficiency", "icon_url", "year_acquired", "endorsed", "is_public", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  experiences: {
    columns: ["id", "user_id", "company", "position", "start_date", "end_date", "description", "logo_url", "location", "technologies", "projects", "is_public", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  blog_posts: {
    columns: ["id", "user_id", "title", "content", "excerpt", "slug", "publish_date", "tags", "cover_image_url", "category", "series", "reading_time", "published", "is_public", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  contact_messages: {
    columns: ["id", "name", "email", "subject", "message", "read", "created_at"],
    public: false,
  },
  user_follows: {
    columns: ["id", "follower_id", "following_id", "created_at"],
    owner: "follower_id",
    public: true,
  },
  comments: {
    columns: ["id", "user_id", "content_type", "content_id", "content", "parent_id", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  reactions: {
    columns: ["id", "user_id", "content_type", "content_id", "reaction_type", "created_at"],
    owner: "user_id",
    public: true,
  },
  activity_feed: {
    columns: ["id", "user_id", "actor_id", "activity_type", "content_type", "content_id", "metadata", "created_at"],
    owner: "actor_id",
    public: false,
  },
  user_roles: {
    columns: ["id", "user_id", "role", "created_at"],
    owner: "user_id",
    public: false,
  },
  site_settings: {
    columns: ["id", "key", "value", "created_at", "updated_at"],
    public: true,
  },
  portfolio_themes: {
    columns: ["id", "user_id", "settings", "created_at", "updated_at"],
    owner: "user_id",
    public: true,
  },
  analytics_events: {
    columns: ["id", "user_id", "pathname", "referrer", "device", "country", "created_at"],
    public: false,
  },
  user_settings: {
    columns: ["id", "user_id", "key", "value", "created_at", "updated_at"],
    owner: "user_id",
    public: false,
  },
  portfolio_sections: {
    columns: ["id", "user_id", "type", "title", "enabled", "is_custom", "display_order", "content", "created_at", "updated_at"],
    owner: "user_id",
    public: false,
  },
  resume_documents: {
    columns: ["id", "user_id", "name", "template", "content", "created_at", "updated_at"],
    owner: "user_id",
    public: false,
  },
};

const jsonColumns = new Set(["tags", "technologies", "projects", "metadata", "value", "content", "settings"]);
const urlColumns = new Set(["image_url", "repo_url", "demo_url", "icon_url", "logo_url", "cover_image_url", "github", "linkedin", "twitter", "website", "avatar_url"]);
const booleanColumns = new Set(["featured", "is_public", "published", "read", "enabled", "is_custom"]);
const numericColumns = new Set(["proficiency", "year_acquired", "endorsed", "stars", "forks", "contributors", "reading_time", "display_order"]);
const validRoles = new Set<Role>(["admin", "moderator", "user"]);
const validReactionTypes = new Set(["like", "love", "celebrate", "insightful", "funny"]);
const validContentTypes = new Set(["project", "blog_post", "comment"]);

function nowIso() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function base64(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < array.length; index += 1) binary += String.fromCharCode(array[index]);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function digest(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

async function safeEqual(left: ArrayBuffer, right: ArrayBuffer) {
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 120_000;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return `pbkdf2-sha256$${iterations}$${base64(salt)}$${base64(bits)}`;
}

async function verifyPassword(password: string, stored: string) {
  try {
    const [algorithm, iterationText, saltText, digestText] = stored.split("$");
    if (algorithm !== "pbkdf2-sha256" || !iterationText || !saltText || !digestText) return false;
    const iterations = Number(iterationText);
    if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 500_000) return false;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromBase64(saltText), iterations, hash: "SHA-256" }, key, 256);
    return safeEqual(bits, fromBase64(digestText).buffer);
  } catch {
    return false;
  }
}

function parseCookies(request: Request) {
  const header = request.headers.get("Cookie") ?? "";
  return Object.fromEntries(header.split(";").map((item) => item.trim().split("=")).filter(([key, value]) => key && value));
}

function allowedOrigins(env: Env) {
  if (env.ALLOWED_ORIGINS !== undefined) return env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
  return env.ENVIRONMENT === "production" ? [] : DEFAULT_ORIGINS;
}

function isAllowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return allowedOrigins(env).includes(origin);
}

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Portify-Client, X-Admin-Bootstrap-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers": "X-Total-Count, X-Request-Id",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && isAllowedOrigin(request, env)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function responseHeaders(request: Request, env: Env, requestId: string) {
  return {
    ...corsHeaders(request, env),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Request-Id": requestId,
    Vary: "Origin, Cookie",
  };
}

function jsonResponse(request: Request, env: Env, requestId: string, data: unknown, status = 200, extra: Record<string, string> = {}) {
  const headers = { ...responseHeaders(request, env, requestId), ...extra };
  return new Response(status === 204 ? null : JSON.stringify({ data }), { status, headers });
}

function errorResponse(request: Request, env: Env, requestId: string, message: string, status = 400, code = "BAD_REQUEST", details?: unknown) {
  return new Response(JSON.stringify({ error: { message, status, code, requestId, ...(details ? { details } : {}) } }), {
    status,
    headers: responseHeaders(request, env, requestId),
  });
}

function text(value: unknown, field: string, maxLength: number, required = true) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (typeof value !== "string") throw new ValidationError(`${field} must be text`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  if (trimmed.length > maxLength) throw new ValidationError(`${field} must be ${maxLength} characters or fewer`);
  return trimmed;
}

function email(value: unknown) {
  const result = text(value, "email", 320);
  if (!result || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new ValidationError("Please provide a valid email address");
  return result.toLowerCase();
}

function booleanValue(value: unknown, field: string, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new ValidationError(`${field} must be boolean`);
  return value;
}

function integerValue(value: unknown, field: string, fallback: number, maximum = 1_000_000_000) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "number") throw new ValidationError(`${field} must be a number`);
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new ValidationError(`${field} must be a non-negative integer`);
  return value;
}

function textArray(value: unknown, field: string, maxItems: number, maxItemLength: number) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`);
  if (value.length > maxItems) throw new ValidationError(`${field} has too many items`);
  return value.map((item) => text(item, field, maxItemLength));
}

function hasControlCharacters(value: string) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function isSafeRelativePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !hasControlCharacters(value);
}

function safeUrl(value: unknown, field: string, required = false) {
  const result = text(value, field, 500, required);
  if (!result) return null;
  try {
    if (hasControlCharacters(result)) throw new Error("invalid characters");
    const parsed = new URL(result);
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.username || parsed.password) throw new Error("invalid URL");
  } catch {
    throw new ValidationError(`${field} must be a valid http or https URL`);
  }
  return result;
}

function dateValue(value: unknown, field: string, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  const result = text(value, field, 40, true);
  if (result && Number.isNaN(Date.parse(result))) throw new ValidationError(`${field} must be a valid date`);
  return result;
}

function validateDateOrder(start: unknown, end: unknown) {
  if (!start || !end) return;
  const startTime = Date.parse(String(start));
  const endTime = Date.parse(String(end));
  if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime < startTime) throw new ValidationError("end_date cannot be earlier than start_date");
}

function object(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("Request body must be an object");
  return value as Row;
}

const themeFonts = new Set(["Inter", "System UI", "Georgia", "Roboto"]);
function relativeLuminance(hex: string) {
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrastRatio(left: string, right: string) {
  const first = relativeLuminance(left);
  const second = relativeLuminance(right);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
function validateThemeContrast(settings: Row) {
  if (contrastRatio(String(settings.textColor), String(settings.backgroundColor)) < 4.5) throw new ValidationError("Text and background colors need a contrast ratio of at least 4.5");
  if (contrastRatio(String(settings.textColor), String(settings.secondaryColor)) < 4.5) throw new ValidationError("Text and secondary colors need a contrast ratio of at least 4.5");
  if (contrastRatio("#ffffff", String(settings.primaryColor)) < 4.5) throw new ValidationError("Primary color needs enough contrast with white button text");
  if (contrastRatio(String(settings.textColor), String(settings.accentColor)) < 3) throw new ValidationError("Text and accent colors need more contrast");
}
function normaliseThemeSettings(value: unknown): Row {
  const input = object(value);
  const colour = (field: string, fallback: string) => typeof input[field] === "string" && /^#[0-9a-f]{6}$/i.test(input[field] as string) ? input[field] as string : fallback;
  const font = (field: string, fallback: string) => typeof input[field] === "string" && themeFonts.has(input[field] as string) ? input[field] as string : fallback;
  const settings: Row = {
    primaryColor: colour("primaryColor", "#7c3aed"),
    secondaryColor: colour("secondaryColor", "#e2e8f0"),
    backgroundColor: colour("backgroundColor", "#ffffff"),
    textColor: colour("textColor", "#111827"),
    accentColor: colour("accentColor", "#f59e0b"),
    fontFamily: font("fontFamily", "Inter"),
    headingFont: font("headingFont", "Inter"),
    bodyFont: font("bodyFont", "Inter"),
    layout: input.layout === "multi-page" ? "multi-page" : "single-page",
    darkMode: input.darkMode === true,
  };
  validateThemeContrast(settings);
  return settings;
}

const siteSettingKeys = new Set(["contact_info", "social_links", "site_info", "theme"]);
const siteSocialFields = ["github", "twitter", "linkedin", "instagram", "youtube", "facebook"];
function optionalTextValue(value: unknown, field: string, maxLength: number) {
  return text(value ?? "", field, maxLength, false) ?? "";
}
function optionalHttpUrl(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return "";
  return safeUrl(value, field) ?? "";
}
function optionalAssetUrl(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return "";
  const result = text(value, field, 500);
  if (!result) return "";
  if (isSafeRelativePath(result)) return result;
  return safeUrl(result, field) ?? "";
}
function normaliseSiteSetting(key: string, value: unknown): Row {
  if (!siteSettingKeys.has(key)) throw new ValidationError("Unsupported site setting");
  const input = object(value);
  if (key === "contact_info") {
    const result: Row = {
      email: input.email === undefined || input.email === null || input.email === "" ? "" : email(input.email),
      phone: optionalTextValue(input.phone, "phone", 40),
      address: optionalTextValue(input.address, "address", 160),
    };
    ["github", "twitter", "linkedin"].forEach((field) => { result[field] = optionalHttpUrl(input[field], field); });
    return result;
  }
  if (key === "social_links") {
    const result: Row = {};
    siteSocialFields.forEach((field) => { result[field] = optionalHttpUrl(input[field], field); });
    return result;
  }
  if (key === "site_info") {
    return {
      title: optionalTextValue(input.title, "title", 160),
      description: optionalTextValue(input.description, "description", 320),
      keywords: optionalTextValue(input.keywords, "keywords", 320),
      author: optionalTextValue(input.author, "author", 120),
      logoUrl: optionalAssetUrl(input.logoUrl, "logoUrl"),
      faviconUrl: optionalAssetUrl(input.faviconUrl, "faviconUrl"),
    };
  }
  return normaliseThemeSettings(value);
}

function sanitiseSiteSettingOutput(value: unknown, key: unknown) {
  if (typeof key !== "string") return {};
  try {
    return normaliseSiteSetting(key, value);
  } catch {
    return {};
  }
}

class ValidationError extends Error {}

async function bodyJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new ValidationError("Request body is too large");
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_BODY_BYTES) throw new ValidationError("Request body is too large");
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Request body must be valid JSON");
  }
}

function requestKey(request: Request, suffix: string) {
  // CF-Connecting-IP is set by Cloudflare. Do not trust a client-supplied
  // forwarding header as a rate-limit identity.
  return `${request.headers.get("CF-Connecting-IP") ?? "unknown"}:${suffix}`;
}

async function rateLimit(db: D1Database, request: Request, suffix: string, limit: number) {
  const key = requestKey(request, suffix).slice(0, 240);
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + 60;
  const row = await dbStatement(db, `INSERT INTO api_rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN api_rate_limits.reset_at <= ? THEN 1 ELSE api_rate_limits.count + 1 END,
      reset_at = CASE WHEN api_rate_limits.reset_at <= ? THEN ? ELSE api_rate_limits.reset_at END
    RETURNING count`, [key, resetAt, now, now, resetAt]).first<{ count: number }>();
  return Number(row?.count ?? limit + 1) <= limit;
}

function sqlBind(statement: D1PreparedStatement, values: unknown[]) {
  return values.length ? statement.bind(...values) : statement;
}

function dbStatement(db: D1Database, sql: string, values: unknown[] = []) {
  return sqlBind(db.prepare(sql), values);
}

function dbValue(column: string, value: unknown) {
  if (booleanColumns.has(column)) return value === true || value === 1 || value === "true" ? 1 : 0;
  if (jsonColumns.has(column) && typeof value === "object" && value !== null) return JSON.stringify(value);
  if (column === "tags" || column === "technologies" || column === "projects") {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (value === null || value === undefined) return "[]";
  }
  return value;
}

function safeStoredUrl(value: unknown) {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value !== "string") return null;
  if (isSafeRelativePath(value)) return value;
  try {
    if (hasControlCharacters(value)) return null;
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.username && !parsed.password ? value : null;
  } catch {
    return null;
  }
}

function outputValue(table: string, column: string, value: unknown): unknown {
  if (booleanColumns.has(column)) return Boolean(value);
  const textContentColumn = column === "content" && (table === "comments" || table === "blog_posts");
  if (jsonColumns.has(column) && !textContentColumn && typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function cleanRow(table: string, row: Row): Row {
  const config = tableConfig[table];
  const result: Row = {};
  if (!config) return row;
  config.columns.forEach((column) => {
    if (column in row) {
      let value = outputValue(table, column, row[column]);
      if (["tags", "technologies", "projects"].includes(column)) {
        value = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 100) : [];
      }
      if (column === "content" && (table === "portfolio_sections" || table === "resume_documents") && (!value || typeof value !== "object" || Array.isArray(value))) value = {};
      result[column] = urlColumns.has(column) ? safeStoredUrl(value) : value;
    }
  });
  if (table === "site_settings") result.value = sanitiseSiteSettingOutput(result.value, result.key);
  if (table === "portfolio_themes" && result.settings !== undefined) {
    try { result.settings = normaliseThemeSettings(result.settings); } catch { result.settings = {}; }
  }
  return result;
}

function userFromRow(row: Row): AuthUser {
  return {
    id: String(row.id),
    email: String(row.email),
    user_metadata: {
      full_name: row.full_name ?? "",
      avatar_url: row.avatar_url ?? "",
    },
    app_metadata: {},
    role: (row.role as Role) ?? "user",
  };
}

async function getAuth(request: Request, env: Env): Promise<AuthContext | null> {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = base64(await digest(token));
  const session = await dbStatement(env.DB, `SELECT s.user_id, u.id, u.email, u.full_name, u.avatar_url, r.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    LEFT JOIN user_roles r ON r.user_id = u.id AND r.role IN ('admin', 'moderator', 'user')
    WHERE s.token_hash = ? AND s.expires_at > ?
    ORDER BY CASE r.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END LIMIT 1`, [tokenHash, Math.floor(Date.now() / 1000)]).first<Row>();
  if (!session) return null;
  const user = userFromRow(session);
  return { user, isAdmin: user.role === "admin" };
}

async function roleForUser(db: D1Database, userId: string): Promise<Role> {
  const row = await dbStatement(db, `SELECT role FROM user_roles WHERE user_id = ? ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END LIMIT 1`, [userId]).first<{ role: Role }>();
  return row?.role && validRoles.has(row.role) ? row.role : "user";
}

async function createSession(db: D1Database, userId: string) {
  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const tokenHash = base64(await digest(token));
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86_400;
  await dbStatement(db, "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [id(), userId, tokenHash, expiresAt, nowIso()]).run();
  return { token, expiresAt };
}

function sessionCookie(request: Request, env: Env, token: string, maxAge: number) {
  const pieces = [`${SESSION_COOKIE}=${token}`, "Path=/", `Max-Age=${maxAge}`, "HttpOnly", "SameSite=Lax"];
  // A cross-origin Vercel -> Worker deployment needs SameSite=None. The
  // browser only accepts that value over HTTPS, which is always true in prod.
  if (env.ENVIRONMENT !== "development" && request.headers.get("Origin") && request.headers.get("Origin") !== new URL(request.url).origin) pieces[pieces.length - 1] = "SameSite=None";
  if (env.ENVIRONMENT !== "development") pieces.push("Secure");
  if (env.SESSION_COOKIE_DOMAIN) pieces.push(`Domain=${env.SESSION_COOKIE_DOMAIN}`);
  return pieces.join("; ");
}

function clearSessionCookie(env: Env) {
  const pieces = [`${SESSION_COOKIE}=`, "Path=/", "Max-Age=0", "HttpOnly", "SameSite=Lax"];
  if (env.ENVIRONMENT !== "development") pieces.push("Secure");
  if (env.SESSION_COOKIE_DOMAIN) pieces.push(`Domain=${env.SESSION_COOKIE_DOMAIN}`);
  return pieces.join("; ");
}

async function authSessionResponse(request: Request, env: Env, requestId: string, auth: AuthContext | null) {
  if (!auth) return jsonResponse(request, env, requestId, { session: null, user: null });
  return jsonResponse(request, env, requestId, {
    session: { user: auth.user, access_token: "", refresh_token: "", expires_at: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86_400 },
    user: auth.user,
  });
}

function validateOrigin(request: Request, env: Env, requestId: string) {
  const origin = request.headers.get("Origin");
  // Credentialed browser mutations must carry an origin so a cross-site form
  // or fetch cannot use the HttpOnly session cookie as a CSRF primitive. Login,
  // signup, bootstrap, and public contact requests remain usable by non-browser
  // clients when they do not carry a session cookie.
  if (!origin && parseCookies(request)[SESSION_COOKIE]) {
    return errorResponse(request, env, requestId, "A request origin is required", 403, "CSRF_FORBIDDEN");
  }
  if (!isAllowedOrigin(request, env)) return errorResponse(request, env, requestId, "Origin is not allowed", 403, "CORS_FORBIDDEN");
  return null;
}

async function handleSignup(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "signup", 5)) return errorResponse(request, env, requestId, "Too many registration attempts. Try again later.", 429, "RATE_LIMITED");
  const body = object(await bodyJson(request));
  const userEmail = email(body.email);
  const password = text(body.password, "password", 200);
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new ValidationError("Password must be at least 8 characters and include a letter and a number");
  const exists = await dbStatement(env.DB, "SELECT id FROM users WHERE email = ?", [userEmail]).first();
  if (exists) return errorResponse(request, env, requestId, "An account with that email already exists", 409, "AUTH_USER_EXISTS");
  const userId = id();
  const passwordHash = await hashPassword(password);
  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata as Row : {};
  const fullName = text(metadata.full_name ?? "", "full_name", 120, false) ?? "";
  const avatarUrl = metadata.avatar_url === undefined || metadata.avatar_url === null || metadata.avatar_url === "" ? "" : (safeUrl(metadata.avatar_url, "avatar_url") ?? "");
  const timestamp = nowIso();
  await env.DB.batch([
    dbStatement(env.DB, "INSERT INTO users (id, email, password_hash, full_name, avatar_url, email_verified, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)", [userId, userEmail, passwordHash, fullName, avatarUrl, timestamp]),
    dbStatement(env.DB, "INSERT INTO profiles (id, full_name, avatar_url, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [userId, fullName, avatarUrl, userEmail, timestamp, timestamp]),
    dbStatement(env.DB, "INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'user', ?)", [id(), userId, timestamp]),
  ]);
  const session = await createSession(env.DB, userId);
  const user: AuthUser = { id: userId, email: userEmail, user_metadata: { full_name: fullName, avatar_url: avatarUrl }, app_metadata: {}, role: "user" };
  return jsonResponse(request, env, requestId, { user, session: { user, access_token: "", refresh_token: "", expires_at: session.expiresAt } }, 201, { "Set-Cookie": sessionCookie(request, env, session.token, SESSION_DAYS * 86_400) });
}

async function handleAdminBootstrap(request: Request, env: Env, requestId: string) {
  if (!env.ADMIN_BOOTSTRAP_TOKEN) return errorResponse(request, env, requestId, "Bootstrap is disabled", 404, "NOT_FOUND");
  if (!rateLimit(env.DB, request, "admin-bootstrap", 3)) return errorResponse(request, env, requestId, "Too many bootstrap attempts. Try again later.", 429, "RATE_LIMITED");
  const provided = request.headers.get("X-Admin-Bootstrap-Token") ?? "";
  const [providedDigest, expectedDigest] = await Promise.all([digest(provided), digest(env.ADMIN_BOOTSTRAP_TOKEN)]);
  if (!(await safeEqual(providedDigest, expectedDigest))) return errorResponse(request, env, requestId, "Invalid bootstrap credentials", 401, "AUTH_INVALID_CREDENTIALS");
  const existingAdmin = await dbStatement(env.DB, "SELECT 1 FROM user_roles WHERE role = 'admin' LIMIT 1").first();
  const bootstrapLock = await dbStatement(env.DB, "SELECT 1 FROM admin_bootstrap_lock WHERE id = 1").first();
  if (existingAdmin || bootstrapLock) return errorResponse(request, env, requestId, "An administrator is already provisioned", 409, "ADMIN_ALREADY_PROVISIONED");
  const body = object(await bodyJson(request));
  const userEmail = email(body.email);
  const password = text(body.password, "password", 200);
  if (!password || password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new ValidationError("Admin password must be at least 12 characters and include a letter and a number");
  const existingUser = await dbStatement(env.DB, "SELECT id FROM users WHERE email = ?", [userEmail]).first<{ id: string }>();
  const userId = existingUser?.id ?? id();
  const fullName = text(body.full_name ?? "", "full_name", 120, false) ?? "";
  const avatarUrl = body.avatar_url === undefined ? "" : (safeUrl(body.avatar_url, "avatar_url") ?? "");
  const timestamp = nowIso();
  const statements: D1PreparedStatement[] = [dbStatement(env.DB, "INSERT INTO admin_bootstrap_lock (id) VALUES (1)", [])];
  if (!existingUser) {
    statements.push(dbStatement(env.DB, "INSERT INTO users (id, email, password_hash, full_name, avatar_url, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)", [userId, userEmail, await hashPassword(password), fullName, avatarUrl, timestamp, timestamp]));
    statements.push(dbStatement(env.DB, "INSERT INTO profiles (id, full_name, avatar_url, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [userId, fullName, avatarUrl, userEmail, timestamp, timestamp]));
  } else {
    statements.push(dbStatement(env.DB, "UPDATE users SET password_hash = ?, full_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?", [await hashPassword(password), fullName, avatarUrl, timestamp, userId]));
    statements.push(dbStatement(env.DB, "UPDATE profiles SET full_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?", [fullName, avatarUrl, timestamp, userId]));
    statements.push(dbStatement(env.DB, "INSERT OR IGNORE INTO profiles (id, full_name, avatar_url, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", [userId, fullName, avatarUrl, userEmail, timestamp, timestamp]));
    statements.push(dbStatement(env.DB, "DELETE FROM sessions WHERE user_id = ?", [userId]));
    statements.push(dbStatement(env.DB, "DELETE FROM user_roles WHERE user_id = ?", [userId]));
  }
  statements.push(dbStatement(env.DB, "INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, 'admin', ?)", [id(), userId, timestamp]));
  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/admin_bootstrap_lock|UNIQUE constraint failed/i.test(message)) return errorResponse(request, env, requestId, "An administrator is already provisioned", 409, "ADMIN_ALREADY_PROVISIONED");
    throw error;
  }
  const session = await createSession(env.DB, userId);
  const adminUser: AuthUser = { id: userId, email: userEmail, user_metadata: { full_name: fullName, avatar_url: avatarUrl }, app_metadata: {}, role: "admin" };
  return jsonResponse(request, env, requestId, { user: adminUser, session: { user: adminUser, access_token: "", refresh_token: "", expires_at: session.expiresAt } }, 201, { "Set-Cookie": sessionCookie(request, env, session.token, SESSION_DAYS * 86_400) });
}

async function handleLogin(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "login", 10)) return errorResponse(request, env, requestId, "Too many sign-in attempts. Try again later.", 429, "RATE_LIMITED");
  const body = object(await bodyJson(request));
  const userEmail = email(body.email);
  const password = text(body.password, "password", 200);
  const user = await dbStatement(env.DB, "SELECT * FROM users WHERE email = ? LIMIT 1", [userEmail]).first<Row>();
  // Do a real password verification only for a matching account. The generic
  // message prevents the endpoint from revealing which emails are registered.
  if (!user || !(await verifyPassword(password ?? "", String(user.password_hash)))) return errorResponse(request, env, requestId, "Invalid email or password", 401, "AUTH_INVALID_CREDENTIALS");
  const timestamp = nowIso();
  await dbStatement(env.DB, "UPDATE users SET last_sign_in_at = ? WHERE id = ?", [timestamp, user.id]).run();
  const role = await roleForUser(env.DB, String(user.id));
  const authUser = userFromRow({ ...user, role });
  const session = await createSession(env.DB, String(user.id));
  return jsonResponse(request, env, requestId, { user: authUser, session: { user: authUser, access_token: "", refresh_token: "", expires_at: session.expiresAt } }, 200, { "Set-Cookie": sessionCookie(request, env, session.token, SESSION_DAYS * 86_400) });
}

async function handleLogout(request: Request, env: Env, requestId: string) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) await dbStatement(env.DB, "DELETE FROM sessions WHERE token_hash = ?", [base64(await digest(token))]).run();
  return jsonResponse(request, env, requestId, null, 204, { "Set-Cookie": clearSessionCookie(env) });
}

async function handleUpdateAuth(request: Request, env: Env, requestId: string, auth: AuthContext | null) {
  if (!auth) return errorResponse(request, env, requestId, "Authentication required", 401, "AUTH_REQUIRED");
  const body = object(await bodyJson(request));
  const updates: string[] = [];
  const values: unknown[] = [];
  const changingSensitiveAccountData = body.email !== undefined || body.password !== undefined;
  if (changingSensitiveAccountData) {
    const currentPassword = text(body.current_password, "current_password", 200);
    const stored = await dbStatement(env.DB, "SELECT password_hash FROM users WHERE id = ?", [auth.user.id]).first<{ password_hash: string }>();
    if (!stored || !(await verifyPassword(currentPassword ?? "", stored.password_hash))) throw new AuthError("Current password is incorrect", 403);
  }
  let nextEmailValue: string | null = null;
  if (body.email !== undefined) {
    const nextEmail = email(body.email);
    nextEmailValue = nextEmail;
    const collision = await dbStatement(env.DB, "SELECT id FROM users WHERE email = ? AND id != ?", [nextEmail, auth.user.id]).first();
    if (collision) return errorResponse(request, env, requestId, "That email address is already in use", 409, "AUTH_EMAIL_EXISTS");
    updates.push("email = ?");
    values.push(nextEmail);
  }
  let passwordChanged = false;
  if (body.password !== undefined) {
    const password = text(body.password, "password", 200);
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new ValidationError("Password must be at least 8 characters and include a letter and a number");
    updates.push("password_hash = ?");
    values.push(await hashPassword(password));
    passwordChanged = true;
  }
  if (updates.length === 0) throw new ValidationError("No account changes were provided");
  updates.push("updated_at = ?");
  values.push(nowIso(), auth.user.id);
  const accountStatements: D1PreparedStatement[] = [dbStatement(env.DB, `UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values)];
  if (nextEmailValue) {
    const profileTimestamp = nowIso();
    accountStatements.push(dbStatement(env.DB, "UPDATE profiles SET email = ?, updated_at = ? WHERE id = ?", [nextEmailValue, profileTimestamp, auth.user.id]));
    accountStatements.push(dbStatement(env.DB, "INSERT OR IGNORE INTO profiles (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)", [auth.user.id, nextEmailValue, profileTimestamp, profileTimestamp]));
  }
  await env.DB.batch(accountStatements);
  let newSession: { token: string; expiresAt: number } | null = null;
  if (passwordChanged) {
    await dbStatement(env.DB, "DELETE FROM sessions WHERE user_id = ?", [auth.user.id]).run();
    newSession = await createSession(env.DB, auth.user.id);
  }
  const updated = await dbStatement(env.DB, "SELECT u.*, r.role FROM users u LEFT JOIN user_roles r ON r.user_id = u.id WHERE u.id = ? ORDER BY CASE r.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END LIMIT 1", [auth.user.id]).first<Row>();
  if (!updated) throw new Error("Account could not be loaded after update");
  const user = userFromRow(updated);
  const headers: Record<string, string> = {};
  if (newSession) headers["Set-Cookie"] = sessionCookie(request, env, newSession.token, SESSION_DAYS * 86_400);
  return jsonResponse(request, env, requestId, { user }, 200, headers);
}

async function handlePasswordResetRequest(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "reset", 5)) return errorResponse(request, env, requestId, "Too many reset requests. Try again later.", 429, "RATE_LIMITED");
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return errorResponse(request, env, requestId, "Password reset email is not configured", 503, "EMAIL_NOT_CONFIGURED");
  const body = object(await bodyJson(request));
  const userEmail = email(body.email);
  const user = await dbStatement(env.DB, "SELECT id, email FROM users WHERE email = ?", [userEmail]).first<{ id: string; email: string }>();
  // Always return the same response for configured deployments to avoid account enumeration.
  if (user) {
    const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const tokenHash = base64(await digest(token));
    const expiresAt = Math.floor(Date.now() / 1000) + 3_600;
    await dbStatement(env.DB, "DELETE FROM password_reset_tokens WHERE user_id = ?", [user.id]).run();
    await dbStatement(env.DB, "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [id(), user.id, tokenHash, expiresAt, nowIso()]).run();
    if (env.RESEND_API_KEY && env.MAIL_FROM) {
      const appUrl = env.APP_URL ?? new URL(request.url).origin;
      let emailResponse: Response;
      try {
        emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: env.MAIL_FROM, to: [user.email], subject: "Reset your Portify password", html: `<p>Reset your password within one hour:</p><p><a href="${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}">Reset password</a></p>` }),
        });
      } catch {
        return errorResponse(request, env, requestId, "Password reset email could not be sent", 502, "EMAIL_DELIVERY_FAILED");
      }
      if (!emailResponse.ok) {
        console.error(JSON.stringify({ requestId, message: "Password reset email provider rejected request", status: emailResponse.status }));
        return errorResponse(request, env, requestId, "Password reset email could not be sent", 502, "EMAIL_DELIVERY_FAILED");
      }
    }
  }
  return jsonResponse(request, env, requestId, null, 202);
}

async function handlePasswordResetComplete(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "reset-complete", 10)) return errorResponse(request, env, requestId, "Too many reset attempts. Try again later.", 429, "RATE_LIMITED");
  const body = object(await bodyJson(request));
  const token = text(body.token, "token", 200);
  const password = text(body.password, "password", 200);
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new ValidationError("Password must be at least 8 characters and include a letter and a number");
  const tokenHash = base64(await digest(token ?? ""));
  const reset = await dbStatement(env.DB, "SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?", [tokenHash, Math.floor(Date.now() / 1000)]).first<{ user_id: string }>();
  if (!reset) return errorResponse(request, env, requestId, "This reset link is invalid or expired", 400, "AUTH_RESET_INVALID");
  await env.DB.batch([
    dbStatement(env.DB, "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [await hashPassword(password), nowIso(), reset.user_id]),
    dbStatement(env.DB, "DELETE FROM sessions WHERE user_id = ?", [reset.user_id]),
    dbStatement(env.DB, "DELETE FROM password_reset_tokens WHERE user_id = ?", [reset.user_id]),
  ]);
  return jsonResponse(request, env, requestId, null, 204);
}

function tableAllowedColumns(table: string) {
  return new Set(tableConfig[table]?.columns ?? []);
}

function typedFilterValue(table: string, field: string, value: unknown, allowNull = true): FilterValue {
  if (value === null) {
    if (!allowNull) throw new ValidationError(`${field} must not be null`);
    return null;
  }
  if (booleanColumns.has(field)) {
    if (typeof value !== "boolean") throw new ValidationError(`${field} must be boolean`);
    return value;
  }
  if (numericColumns.has(field)) {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new ValidationError(`${field} must be a non-negative integer`);
    return value;
  }
  if (typeof value !== "string") throw new ValidationError(`${field} must be text`);
  return value;
}

function filterValue(table: string, field: string, raw: string): FilterValue {
  if (raw === "null") return typedFilterValue(table, field, null);
  if (booleanColumns.has(field)) {
    if (raw === "true" || raw === "1") return typedFilterValue(table, field, true);
    if (raw === "false" || raw === "0") return typedFilterValue(table, field, false);
    throw new ValidationError(`${field} must be boolean`);
  }
  if (numericColumns.has(field)) {
    if (!/^\d+$/.test(raw)) throw new ValidationError(`${field} must be a non-negative integer`);
    const result = Number(raw);
    if (!Number.isSafeInteger(result)) throw new ValidationError(`${field} must be a non-negative integer`);
    return typedFilterValue(table, field, result);
  }
  return typedFilterValue(table, field, raw);
}

function filtersFromUrl(url: URL, table: string, publicOnly = false): Filter[] {
  const configured = tableConfig[table];
  const allowed = publicOnly && configured?.publicColumns ? new Set(configured.publicColumns) : tableAllowedColumns(table);
  const filters: Filter[] = [];
  url.searchParams.forEach((value, key) => {
    if (filters.length >= 20 && (key.startsWith("eq_") || key.startsWith("in_") || key.startsWith("not_"))) throw new ValidationError("Too many filters");
    if (key.startsWith("eq_")) {
      const field = key.slice(3);
      if (!allowed.has(field)) throw new ValidationError(`Invalid ${field || "filter"} filter`);
      filters.push({ kind: "eq", field, value: filterValue(table, field, value) });
    } else if (key.startsWith("in_")) {
      const field = key.slice(3);
      if (!allowed.has(field)) throw new ValidationError(`Invalid ${field || "filter"} filter`);
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new ValidationError(`Invalid ${field} filter`);
      }
      if (!Array.isArray(parsed)) throw new ValidationError(`Invalid ${field} filter`);
      if (parsed.length > 100) throw new ValidationError(`Too many values in ${field} filter`);
      const values = parsed.map((item) => typedFilterValue(table, field, item, false));
      if (values.some((item) => item === null)) throw new ValidationError(`Invalid ${field} filter`);
      filters.push({ kind: "in", field, values: values as Array<string | number | boolean> });
    } else if (key.startsWith("not_")) {
      const field = key.slice(4);
      if (!allowed.has(field)) throw new ValidationError(`Invalid ${field || "filter"} filter`);
      const [operator, ...rest] = value.split(".");
      const rawValue = rest.join(".");
      if (operator === "is" && rawValue === "null") filters.push({ kind: "not", field, operator, value: null });
      else if (operator === "neq" && rawValue && rawValue !== "null") filters.push({ kind: "not", field, operator, value: filterValue(table, field, rawValue) });
      else throw new ValidationError(`Invalid ${field} filter`);
    }
  });
  return filters;
}

function filtersFromBody(value: unknown, table: string): Filter[] {
  if (!Array.isArray(value)) return [];
  if (value.length > 20) throw new ValidationError("Too many filters");
  const allowed = tableAllowedColumns(table);
  return value.map((filter): Filter => {
    if (!filter || typeof filter !== "object") throw new ValidationError("Invalid filter");
    const candidate = filter as Record<string, unknown>;
    if (typeof candidate.field !== "string" || !allowed.has(candidate.field)) throw new ValidationError("Invalid filter field");
    if (candidate.kind === "eq") return { kind: "eq", field: candidate.field, value: typedFilterValue(table, candidate.field, candidate.value) };
    if (candidate.kind === "in") {
      if (!Array.isArray(candidate.values)) throw new ValidationError("Invalid filter values");
      if (candidate.values.length > 100) throw new ValidationError("Too many values in filter");
      const values = candidate.values.map((item) => typedFilterValue(table, candidate.field as string, item, false));
      if (values.some((item) => item === null)) throw new ValidationError("Invalid filter values");
      return { kind: "in", field: candidate.field, values: values as Array<string | number | boolean> };
    }
    if (candidate.kind === "not" && (candidate.operator === "is" || candidate.operator === "neq")) {
      if (candidate.operator === "is" && candidate.value === null) return { kind: "not", field: candidate.field, operator: "is", value: null };
      if (candidate.operator === "neq") return { kind: "not", field: candidate.field, operator: "neq", value: typedFilterValue(table, candidate.field, candidate.value, false) };
    }
    throw new ValidationError("Invalid filter");
  });
}

function buildWhere(table: string, filters: Filter[], auth: AuthContext | null, mode: "read" | "write" = "read", moderatorCanManage = false) {
  const clauses: string[] = [];
  const binds: unknown[] = [];
  const config = tableConfig[table];
  if (!config) throw new ValidationError("Unknown resource");

  if (mode === "read") {
    if (table === "contact_messages" || table === "analytics_events") {
      if (!auth?.isAdmin) throw new AuthError("Administrator access required", 403);
    } else if (table === "user_roles") {
      if (!auth) throw new AuthError("Authentication required", 401);
      if (auth.isAdmin) {
        clauses.push("1 = 1");
      } else {
        clauses.push("user_id = ?");
        binds.push(auth.user.id);
      }
    } else if (table === "activity_feed") {
      if (!auth) throw new AuthError("Authentication required", 401);
      clauses.push("(user_id = ? OR actor_id = ?)");
      binds.push(auth.user.id, auth.user.id);
    } else if (table === "user_settings" || table === "resume_documents") {
      if (!auth) throw new AuthError("Authentication required", 401);
      clauses.push("user_id = ?");
      binds.push(auth.user.id);
    } else if (table === "portfolio_sections") {
      if (!auth) throw new AuthError("Authentication required", 401);
      if (auth.isAdmin) clauses.push("1 = 1");
      else {
        clauses.push("user_id = ?");
        binds.push(auth.user.id);
      }
    } else if (table === "site_settings") {
      if (auth?.isAdmin) clauses.push("1 = 1");
      else {
        clauses.push("key IN ('contact_info', 'social_links', 'site_info', 'theme')");
      }
    } else if (table === "portfolio_themes") {
      clauses.push("1 = 1");
    } else if (["projects", "skills", "experiences", "blog_posts"].includes(table)) {
      if (auth?.isAdmin) clauses.push("1 = 1");
      else if (auth) {
        clauses.push("(is_public = 1 OR user_id = ?)");
        binds.push(auth.user.id);
      } else clauses.push("is_public = 1");
      if (table === "blog_posts") clauses.push("(published = 1 OR user_id = ?)");
      if (table === "blog_posts" && auth) binds.push(auth.user.id);
      if (table === "blog_posts" && !auth) binds.push("__anonymous__");
    } else if (table === "comments") {
      clauses.push("((comments.content_type = 'project' AND EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.content_id AND projects.is_public = 1)) OR (comments.content_type = 'blog_post' AND EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = comments.content_id AND blog_posts.is_public = 1 AND blog_posts.published = 1)))");
    } else if (table === "reactions") {
      clauses.push("((reactions.content_type = 'project' AND EXISTS (SELECT 1 FROM projects WHERE projects.id = reactions.content_id AND projects.is_public = 1)) OR (reactions.content_type = 'blog_post' AND EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = reactions.content_id AND blog_posts.is_public = 1 AND blog_posts.published = 1)) OR (reactions.content_type = 'comment' AND EXISTS (SELECT 1 FROM comments LEFT JOIN projects ON comments.content_type = 'project' AND projects.id = comments.content_id LEFT JOIN blog_posts ON comments.content_type = 'blog_post' AND blog_posts.id = comments.content_id WHERE comments.id = reactions.content_id AND ((comments.content_type = 'project' AND projects.is_public = 1) OR (comments.content_type = 'blog_post' AND blog_posts.is_public = 1 AND blog_posts.published = 1)))))");
    } else if (table === "user_follows" || table === "usernames" || table === "profiles") {
      clauses.push("1 = 1");
    } else if (!config.public) {
      throw new AuthError("Administrator access required", 403);
    }
  } else {
    if (!auth) throw new AuthError("Authentication required", 401);
    if (table === "site_settings" || table === "user_roles" || table === "contact_messages") {
      if (!auth.isAdmin) throw new AuthError("Administrator access required", 403);
    } else if (config.owner && (!auth.isAdmin || table === "user_settings" || table === "resume_documents")) {
      if (moderatorCanManage && auth.user.role === "moderator") clauses.push("1 = 1");
      else {
        clauses.push(`"${config.owner}" = ?`);
        binds.push(auth.user.id);
      }
    }
  }

  filters.forEach((filter) => {
    if (filter.kind === "eq") {
      clauses.push(`"${filter.field}" ${filter.value === null ? "IS NULL" : "= ?"}`);
      if (filter.value !== null) binds.push(filter.value);
    } else if (filter.kind === "in") {
      if (filter.values.length === 0) clauses.push("1 = 0");
      else {
        clauses.push(`"${filter.field}" IN (${filter.values.map(() => "?").join(", ")})`);
        binds.push(...filter.values);
      }
    } else if (filter.kind === "not") {
      if (filter.operator === "is" && filter.value === null) clauses.push(`"${filter.field}" IS NOT NULL`);
      else if (filter.operator === "neq") {
        clauses.push(`"${filter.field}" != ?`);
        binds.push(filter.value);
      }
    }
  });
  return { sql: clauses.length ? clauses.join(" AND ") : "1 = 1", binds };
}

async function attachProfileEmails(env: Env, rows: Row[]) {
  if (rows.length === 0) return rows;
  const ids = [...new Set(rows.map((row) => String(row.id)).filter(Boolean))];
  if (ids.length === 0) return rows;
  const placeholders = ids.map(() => "?").join(", ");
  const accounts = await dbStatement(env.DB, `SELECT id, email FROM users WHERE id IN (${placeholders})`, ids).all<{ id: string; email: string }>();
  const emailById = new Map(accounts.results.map((account) => [String(account.id), account.email]));
  return rows.map((row) => ({ ...row, email: emailById.get(String(row.id)) ?? null }));
}

async function attachCommentProfiles(env: Env, rows: Row[]) {
  if (rows.length === 0) return rows;
  const ids = [...new Set(rows.map((row) => String(row.user_id)).filter(Boolean))];
  if (ids.length === 0) return rows;
  const placeholders = ids.map(() => "?").join(", ");
  const profiles = await dbStatement(env.DB, `SELECT id, full_name, avatar_url FROM profiles WHERE id IN (${placeholders})`, ids).all<Row>();
  const profileMap = new Map(profiles.results.map((profile) => [String(profile.id), cleanRow("profiles", profile)]));
  return rows.map((row) => ({ ...row, user: profileMap.get(String(row.user_id)) ?? null }));
}

async function handleDataRead(request: Request, env: Env, requestId: string, table: string, auth: AuthContext | null) {
  const url = new URL(request.url);
  const config = tableConfig[table];
  if (!config) return errorResponse(request, env, requestId, "Resource not found", 404, "RESOURCE_NOT_FOUND");
  const filters = filtersFromUrl(url, table, table === "profiles" && !auth?.isAdmin);
  const where = buildWhere(table, filters, auth, "read");
  const canReadPrivateProfile = table === "profiles" && Boolean(auth) && (auth?.isAdmin || filters.some((filter) => filter.kind === "eq" && filter.field === "id" && filter.value === auth?.user.id));
  const selectedColumns = config.publicColumns && !auth?.isAdmin && !canReadPrivateProfile ? config.publicColumns : config.columns;
  const allowed = selectedColumns.map((column) => `"${column}"`).join(", ");
  const cacheHeaders = !auth && config.public ? { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } : {};
  const orderColumns = table === "profiles" && !auth?.isAdmin && config.publicColumns ? new Set(config.publicColumns) : tableAllowedColumns(table);
  const orders = url.searchParams.getAll("order").map((value) => {
    const [field, direction, ...extra] = value.split(".");
    if (!field || extra.length > 0 || !orderColumns.has(field) || (direction && direction !== "asc" && direction !== "desc")) throw new ValidationError("Invalid order field or direction");
    return `"${field}" ${direction === "desc" ? "DESC" : "ASC"}`;
  });
  const rawLimit = url.searchParams.get("limit");
  let limit = 100;
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) throw new ValidationError("limit must be a positive integer");
    const parsedLimit = Number(rawLimit);
    if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 1) throw new ValidationError("limit must be a positive integer");
    limit = Math.min(100, parsedLimit);
  }
  const rowsResult = await dbStatement(env.DB, `SELECT ${allowed} FROM "${table}" WHERE ${where.sql}${orders.length ? ` ORDER BY ${orders.join(", ")}` : ""} LIMIT ${limit}`, where.binds).all<Row>();
  let rows = rowsResult.results.map((row) => cleanRow(table, row));
  if (table === "profiles" && auth && selectedColumns.includes("email")) rows = await attachProfileEmails(env, rows);
  if (table === "comments") rows = await attachCommentProfiles(env, rows);
  const count = url.searchParams.get("count") === "exact" ? (await dbStatement(env.DB, `SELECT COUNT(*) AS count FROM "${table}" WHERE ${where.sql}`, where.binds).first<{ count: number }>())?.count ?? rows.length : undefined;
  if (url.searchParams.get("single") === "true" || url.searchParams.get("maybeSingle") === "true") {
    if (rows.length === 0) {
      if (url.searchParams.get("maybeSingle") === "true") return jsonResponse(request, env, requestId, null, 200, cacheHeaders);
      return errorResponse(request, env, requestId, "No rows found", 406, "PGRST116");
    }
    if (rows.length > 1) return errorResponse(request, env, requestId, "Multiple rows found", 406, "PGRST116");
    return jsonResponse(request, env, requestId, rows[0], 200, cacheHeaders);
  }
  return jsonResponse(request, env, requestId, rows, 200, { ...cacheHeaders, ...(count === undefined ? {} : { "X-Total-Count": String(count) }) });
}

function normalizeWrite(table: string, candidate: Row, auth: AuthContext | null): Row {
  const config = tableConfig[table];
  if (!config) throw new ValidationError("Resource not found");
  const row: Row = {};
  config.columns.forEach((column) => {
    if (candidate[column] !== undefined) row[column] = candidate[column];
  });
  // Profile email is derived from users.email and can only be changed through
  // the account-security endpoint, never through the generic profile resource.
  if (table === "profiles") delete row.email;
  // Every user-owned record is attributed to the authenticated principal. Admin
  // privileges allow managing existing rows, but never impersonating another
  // user when creating community or portfolio activity.
  if (config.owner && auth && table !== "user_roles") row[config.owner] = auth.user.id;
  if (!row.id) row.id = id();
  const timestamp = nowIso();
  if (!row.created_at) row.created_at = timestamp;
  if (config.columns.includes("updated_at")) row.updated_at = timestamp;
  if (table === "usernames" && typeof row.username === "string") row.username = row.username.trim().toLowerCase();
  if (table === "projects") {
    row.title = text(row.title, "title", 120);
    row.description = text(row.description, "description", 500);
    if (row.long_description !== undefined && row.long_description !== null) row.long_description = text(row.long_description, "long_description", 20_000, false);
    row.tags = textArray(row.tags, "tag", 20, 40);
    row.category = text(row.category ?? "", "category", 80, false);
    ["image_url", "repo_url", "demo_url"].forEach((field) => { if (row[field] !== undefined && row[field] !== null && row[field] !== "") row[field] = safeUrl(row[field], field); });
    row.featured = booleanValue(row.featured, "featured", false);
    row.is_public = booleanValue(row.is_public, "is_public", true);
    row.stars = integerValue(row.stars, "stars", 0);
    row.forks = integerValue(row.forks, "forks", 0);
    row.contributors = integerValue(row.contributors, "contributors", 0);
  } else if (table === "skills") {
    row.name = text(row.name, "name", 80);
    row.category = text(row.category, "category", 40);
    const proficiency = row.proficiency;
    if (typeof proficiency !== "number" || !Number.isSafeInteger(proficiency) || proficiency < 0 || proficiency > 100) throw new ValidationError("proficiency must be an integer between 0 and 100");
    row.proficiency = proficiency;
    if (row.endorsed !== undefined && row.endorsed !== null && row.endorsed !== 0) throw new ValidationError("endorsed is server-managed");
    row.endorsed = 0;
    const rawYear = row.year_acquired;
    const yearAcquired = rawYear === undefined || rawYear === null || rawYear === "" ? null : integerValue(rawYear, "year_acquired", 0, new Date().getUTCFullYear() + 1);
    if (yearAcquired !== null && yearAcquired < 1900) throw new ValidationError("year_acquired must be 1900 or later");
    row.year_acquired = yearAcquired;
    if (row.icon_url !== undefined && row.icon_url !== null && row.icon_url !== "") row.icon_url = safeUrl(row.icon_url, "icon_url");
    row.is_public = booleanValue(row.is_public, "is_public", true);
  } else if (table === "experiences") {
    row.company = text(row.company, "company", 120);
    row.position = text(row.position, "position", 120);
    row.description = text(row.description, "description", 20_000);
    row.start_date = dateValue(row.start_date, "start_date", true);
    row.end_date = dateValue(row.end_date, "end_date");
    validateDateOrder(row.start_date, row.end_date);
    row.location = text(row.location ?? "", "location", 120, false);
    row.logo_url = row.logo_url === undefined || row.logo_url === null || row.logo_url === "" ? null : safeUrl(row.logo_url, "logo_url");
    row.technologies = textArray(row.technologies, "technology", 30, 80);
    row.projects = textArray(row.projects, "project", 30, 160);
    row.is_public = booleanValue(row.is_public, "is_public", true);
  } else if (table === "blog_posts") {
    row.title = text(row.title, "title", 180);
    row.content = text(row.content, "content", 100_000);
    row.excerpt = text(row.excerpt ?? row.title, "excerpt", 500);
    const slugValue = text(row.slug, "slug", 180);
    const slug = slugValue?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") ?? "";
    if (slug.length < 3) throw new ValidationError("slug must contain at least 3 valid characters");
    row.slug = slug;
    row.tags = textArray(row.tags, "tag", 20, 40);
    if (row.cover_image_url !== undefined && row.cover_image_url !== null && row.cover_image_url !== "") row.cover_image_url = safeUrl(row.cover_image_url, "cover_image_url");
    row.reading_time = integerValue(row.reading_time, "reading_time", 1, 1_440);
    row.published = booleanValue(row.published, "published", false);
    row.is_public = booleanValue(row.is_public, "is_public", true);
    row.publish_date = dateValue(row.publish_date, "publish_date");
    row.publish_date = row.published ? (row.publish_date || timestamp) : row.publish_date;
    row.category = text(row.category ?? "", "category", 80, false);
    row.series = text(row.series ?? "", "series", 120, false);
  } else if (table === "profiles") {
    row.full_name = text(row.full_name ?? "", "full_name", 120, false);
    row.title = text(row.title ?? "", "title", 160, false);
    row.bio = text(row.bio ?? "", "bio", 1_000, false);
    row.location = text(row.location ?? "", "location", 120, false);
    row.phone = text(row.phone ?? "", "phone", 40, false);
    ["website", "github", "linkedin", "twitter", "avatar_url"].forEach((field) => {
      if (row[field] === undefined || row[field] === null || row[field] === "") row[field] = null;
      else row[field] = safeUrl(row[field], field);
    });
  } else if (table === "usernames") {
    const username = text(row.username, "username", 30)?.toLowerCase();
    if (!username || !/^[a-z0-9_-]{3,30}$/.test(username)) throw new ValidationError("Username must be 3–30 characters and use only letters, numbers, hyphens, or underscores");
    row.username = username;
  } else if (table === "comments") {
    if (!(String(row.content_type) === "project" || String(row.content_type) === "blog_post")) throw new ValidationError("Invalid comment content type");
    row.content_id = text(row.content_id, "content_id", 100);
    row.content = text(row.content, "content", 2_000);
    row.parent_id = row.parent_id === undefined || row.parent_id === null || row.parent_id === "" ? null : text(row.parent_id, "parent_id", 100);
  } else if (table === "reactions") {
    if (!validContentTypes.has(String(row.content_type))) throw new ValidationError("Invalid reaction content type");
    if (!validReactionTypes.has(String(row.reaction_type))) throw new ValidationError("Invalid reaction type");
    row.content_id = text(row.content_id, "content_id", 100);
  } else if (table === "user_follows") {
    if (!auth) throw new AuthError("Authentication required", 401);
    row.follower_id = auth.user.id;
    row.following_id = text(row.following_id, "following_id", 100);
    if (row.following_id === auth.user.id) throw new ValidationError("You cannot follow yourself");
  } else if (table === "activity_feed") {
    if (!auth) throw new AuthError("Authentication required", 401);
    row.actor_id = auth.user.id;
    row.user_id = text(row.user_id, "user_id", 100);
  } else if (table === "site_settings") {
    row.key = text(row.key, "key", 80);
    if (!auth?.isAdmin) throw new AuthError("Administrator access required", 403);
    row.value = normaliseSiteSetting(String(row.key), row.value);
  } else if (table === "portfolio_themes") {
    if (!auth) throw new AuthError("Authentication required", 401);
    row.settings = normaliseThemeSettings(row.settings);
  } else if (table === "user_roles") {
    if (!auth?.isAdmin) throw new AuthError("Administrator access required", 403);
    row.user_id = text(row.user_id, "user_id", 100);
    if (!validRoles.has(String(row.role) as Role)) throw new ValidationError("Invalid role");
  } else if (table === "contact_messages") {
    row.name = text(row.name, "name", 120);
    row.email = email(row.email);
    row.subject = text(row.subject, "subject", 180);
    row.message = text(row.message, "message", 5_000);
    row.read = false;
  } else if (table === "user_settings") {
    if (!auth) throw new AuthError("Authentication required", 401);
    row.user_id = auth.user.id;
    row.key = text(row.key, "key", 80);
    if (!row.value || typeof row.value !== "object" || Array.isArray(row.value)) throw new ValidationError("value must be an object");
  } else if (table === "portfolio_sections") {
    if (!auth) throw new AuthError("Authentication required", 401);
    row.user_id = auth.user.id;
    row.type = text(row.type, "type", 40);
    row.title = text(row.title, "title", 120);
    row.enabled = booleanValue(row.enabled, "enabled", true);
    row.is_custom = booleanValue(row.is_custom, "is_custom", false);
    row.display_order = integerValue(row.display_order, "display_order", 0, 10_000);
    if (row.content === undefined) row.content = {};
    if (!row.content || typeof row.content !== "object" || Array.isArray(row.content)) throw new ValidationError("content must be an object");
  } else if (table === "resume_documents") {
    if (!auth) throw new AuthError("Authentication required", 401);
    row.user_id = auth.user.id;
    row.name = text(row.name, "name", 120);
    row.template = text(row.template ?? "modern", "template", 40);
    if (row.content === undefined) row.content = {};
    if (!row.content || typeof row.content !== "object" || Array.isArray(row.content)) throw new ValidationError("content must be an object");
  }
  return row;
}

function validatePatch(table: string, values: Row, settingKey?: string) {
  const optionalText = (field: string, max: number) => { if (field in values) values[field] = text(values[field], field, max, false); };
  const optionalUrl = (field: string) => { if (field in values) values[field] = values[field] === undefined || values[field] === null || values[field] === "" ? null : safeUrl(values[field], field); };
  if (table === "profiles") {
    optionalText("full_name", 120); optionalText("title", 160); optionalText("bio", 1_000); optionalText("location", 120); optionalText("phone", 40);
    if ("email" in values) values.email = values.email === undefined || values.email === null || values.email === "" ? null : email(values.email);
    ["website", "github", "linkedin", "twitter", "avatar_url"].forEach(optionalUrl);
  } else if (table === "projects") {
    optionalText("title", 120); optionalText("description", 500); optionalText("long_description", 20_000); optionalText("category", 80);
    ["image_url", "repo_url", "demo_url"].forEach(optionalUrl);
    if ("tags" in values) values.tags = textArray(values.tags, "tag", 20, 40);
    if ("featured" in values) values.featured = booleanValue(values.featured, "featured", false);
    if ("is_public" in values) values.is_public = booleanValue(values.is_public, "is_public", true);
    ["stars", "forks", "contributors"].forEach((field) => { if (field in values) values[field] = integerValue(values[field], field, 0); });
  } else if (table === "skills") {
    optionalText("name", 80); optionalText("category", 40);
    if ("proficiency" in values) { const proficiency = values.proficiency; if (typeof proficiency !== "number" || !Number.isSafeInteger(proficiency) || proficiency < 0 || proficiency > 100) throw new ValidationError("proficiency must be an integer between 0 and 100"); values.proficiency = proficiency; }
    if ("endorsed" in values) throw new ValidationError("endorsed is server-managed");
    if ("year_acquired" in values) { const year = values.year_acquired === null || values.year_acquired === "" ? null : integerValue(values.year_acquired, "year_acquired", 0, new Date().getUTCFullYear() + 1); if (year !== null && year < 1900) throw new ValidationError("year_acquired must be 1900 or later"); values.year_acquired = year; }
    optionalUrl("icon_url");
    if ("is_public" in values) values.is_public = booleanValue(values.is_public, "is_public", true);
  } else if (table === "experiences") {
    if ("company" in values) optionalText("company", 120);
    if ("position" in values) optionalText("position", 120);
    if ("start_date" in values) values.start_date = dateValue(values.start_date, "start_date", true);
    if ("end_date" in values) values.end_date = dateValue(values.end_date, "end_date");
    if ("start_date" in values || "end_date" in values) validateDateOrder(values.start_date, values.end_date);
    optionalText("description", 20_000); optionalText("location", 120); optionalUrl("logo_url");
    if ("technologies" in values) values.technologies = textArray(values.technologies, "technology", 30, 80);
    if ("projects" in values) values.projects = textArray(values.projects, "project", 30, 160);
    if ("is_public" in values) values.is_public = booleanValue(values.is_public, "is_public", true);
  } else if (table === "blog_posts") {
    optionalText("title", 180); optionalText("content", 100_000); optionalText("excerpt", 500); optionalText("category", 80); optionalText("series", 120); optionalUrl("cover_image_url");
    if ("slug" in values) { const slug = text(values.slug, "slug", 180)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") ?? ""; if (slug.length < 3) throw new ValidationError("slug must contain at least 3 valid characters"); values.slug = slug; }
    if ("tags" in values) values.tags = textArray(values.tags, "tag", 20, 40);
    if ("published" in values) values.published = booleanValue(values.published, "published", false);
    if ("is_public" in values) values.is_public = booleanValue(values.is_public, "is_public", true);
    if ("reading_time" in values) values.reading_time = integerValue(values.reading_time, "reading_time", 1, 1_440);
    if ("publish_date" in values) values.publish_date = dateValue(values.publish_date, "publish_date");
  } else if (table === "usernames") {
    if ("username" in values) { const username = text(values.username, "username", 30)?.toLowerCase() ?? ""; if (!/^[a-z0-9_-]{3,30}$/.test(username)) throw new ValidationError("Username must be 3–30 characters and use only letters, numbers, hyphens, or underscores"); values.username = username; }
  } else if (table === "comments") {
    if ("content_type" in values || "content_id" in values || "parent_id" in values) throw new ValidationError("Comment targets cannot be changed");
    if ("content" in values) values.content = text(values.content, "content", 2_000);
  } else if (table === "reactions" || table === "user_follows") {
    throw new ValidationError(`${table} records cannot be edited`);
  } else if (table === "user_roles") {
    if ("role" in values && !validRoles.has(String(values.role) as Role)) throw new ValidationError("Invalid role");
  } else if (table === "site_settings") {
    if ("key" in values) throw new ValidationError("Site setting keys cannot be changed");
    if ("value" in values) {
      if (!settingKey) throw new ValidationError("A site setting key is required");
      values.value = normaliseSiteSetting(settingKey, values.value);
    }
  } else if (table === "user_settings") {
    if ("value" in values && (!values.value || typeof values.value !== "object" || Array.isArray(values.value))) throw new ValidationError("value must be an object");
  } else if (table === "portfolio_themes") {
    if ("settings" in values) values.settings = normaliseThemeSettings(values.settings);
  } else if (table === "portfolio_sections") {
    optionalText("type", 40); optionalText("title", 120);
    if ("enabled" in values) values.enabled = booleanValue(values.enabled, "enabled", true);
    if ("is_custom" in values) values.is_custom = booleanValue(values.is_custom, "is_custom", false);
    if ("display_order" in values) values.display_order = integerValue(values.display_order, "display_order", 0, 10_000);
    if ("content" in values && (!values.content || typeof values.content !== "object" || Array.isArray(values.content))) throw new ValidationError("content must be an object");
  } else if (table === "contact_messages") {
    if ("read" in values && typeof values.read !== "boolean") throw new ValidationError("read must be boolean");
  } else if (table === "resume_documents") {
    optionalText("name", 120); optionalText("template", 40); if ("content" in values && (!values.content || typeof values.content !== "object" || Array.isArray(values.content))) throw new ValidationError("content must be an object");
  }
}

async function validateExperiencePatchDateOrder(env: Env, where: { sql: string; binds: unknown[] }, values: Row) {
  const hasStart = "start_date" in values;
  const hasEnd = "end_date" in values;
  if (!hasStart && !hasEnd) return;
  const startExpression = hasStart ? (values.start_date ? "julianday(?)" : "NULL") : "julianday(start_date)";
  const endExpression = hasEnd ? (values.end_date ? "julianday(?)" : "NULL") : "julianday(end_date)";
  const invalid = await dbStatement(env.DB, `SELECT 1 AS invalid FROM experiences WHERE ${where.sql} AND ${startExpression} IS NOT NULL AND ${endExpression} IS NOT NULL AND ${endExpression} < ${startExpression} LIMIT 1`, [
    ...where.binds,
    ...(hasStart && values.start_date ? [values.start_date] : []),
    ...(hasEnd && values.end_date ? [values.end_date] : []),
    ...(hasEnd && values.end_date ? [values.end_date] : []),
    ...(hasStart && values.start_date ? [values.start_date] : []),
  ]).first();
  if (invalid) throw new ValidationError("end_date cannot be earlier than start_date");
}

const defaultConflictTargets: Record<string, string> = {
  site_settings: "key",
  user_settings: "user_id, key",
  portfolio_themes: "user_id",
};

function resolveConflictTarget(table: string, requested?: string) {
  const target = (requested ?? defaultConflictTargets[table] ?? "id").split(",").map((column) => column.trim()).filter(Boolean);
  if (target.length === 0 || target.some((column) => !tableAllowedColumns(table).has(column))) throw new ValidationError("Invalid conflict target");
  const supported = target.length === 1 && target[0] === "id"
    ? true
    : target.join(",") === defaultConflictTargets[table];
  if (!supported) throw new ValidationError("Unsupported conflict target");
  return target.join(", ");
}

async function insertRows(env: Env, table: string, candidates: unknown[], auth: AuthContext | null, upsert: boolean, onConflict?: string) {
  if (candidates.length === 0 || candidates.length > 100) throw new ValidationError("Provide between 1 and 100 records");
  const resolvedConflictTarget = upsert ? resolveConflictTarget(table, onConflict) : undefined;
  const rows = candidates.map((candidate) => normalizeWrite(table, object(candidate), auth));
  if (table === "profiles" && auth) {
    const account = await dbStatement(env.DB, "SELECT email FROM users WHERE id = ?", [auth.user.id]).first<{ email: string }>();
    rows.forEach((row) => { row.email = account?.email ?? null; });
  }
  if (table === "comments" || table === "reactions") {
    for (const row of rows) {
      const contentType = String(row.content_type);
      const contentId = String(row.content_id);
      if (table === "comments" && row.parent_id) {
        const parent = await dbStatement(env.DB, "SELECT content_type, content_id FROM comments WHERE id = ?", [row.parent_id]).first<Row>();
        if (!parent || parent.content_type !== row.content_type || parent.content_id !== row.content_id) throw new ValidationError("Reply target is invalid");
      }
      if (contentType === "comment") {
        const target = await dbStatement(env.DB, `SELECT comments.id FROM comments
          LEFT JOIN projects ON comments.content_type = 'project' AND projects.id = comments.content_id
          LEFT JOIN blog_posts ON comments.content_type = 'blog_post' AND blog_posts.id = comments.content_id
          WHERE comments.id = ? AND ((comments.content_type = 'project' AND projects.is_public = 1)
            OR (comments.content_type = 'blog_post' AND blog_posts.is_public = 1 AND blog_posts.published = 1))`, [contentId]).first();
        if (!target) throw new ValidationError("Content target is not public or does not exist");
      } else {
        const tableName = contentType === "project" ? "projects" : "blog_posts";
        const publishedClause = tableName === "blog_posts" ? " AND published = 1" : "";
        const target = await dbStatement(env.DB, `SELECT id FROM ${tableName} WHERE id = ? AND is_public = 1${publishedClause}`, [contentId]).first();
        if (!target) throw new ValidationError("Content target is not public or does not exist");
      }
    }
  }
  if (table === "user_follows") {
    for (const row of rows) {
      const target = await dbStatement(env.DB, "SELECT id FROM users WHERE id = ?", [row.following_id]).first();
      if (!target) throw new ValidationError("The account to follow does not exist");
    }
  }
  if (table === "user_roles") {
    for (const row of rows) {
      const target = await dbStatement(env.DB, "SELECT id FROM users WHERE id = ?", [row.user_id]).first();
      if (!target) throw new ValidationError("The account for this role does not exist");
    }
  }
  const config = tableConfig[table];
  const statements = rows.map((row) => {
    const columns = config.columns.filter((column) => row[column] !== undefined);
    const names = columns.map((column) => `"${column}"`).join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => dbValue(column, row[column]));
    let sql = `INSERT INTO "${table}" (${names}) VALUES (${placeholders})`;
    if (upsert) {
      const conflict = resolvedConflictTarget as string;
      const conflictParts = conflict.split(",").map((column) => column.trim());
      const conflictColumns = new Set(conflictParts);
      const updates = columns.filter((column) => column !== "id" && column !== "created_at" && !conflictColumns.has(column));
      if (updates.length > 0) sql += ` ON CONFLICT (${conflict}) DO UPDATE SET ${updates.map((column) => `"${column}" = excluded."${column}"`).join(", ")}`;
      else sql += ` ON CONFLICT (${conflict}) DO NOTHING`;
    }
    return dbStatement(env.DB, sql, values);
  });
  for (let index = 0; index < statements.length; index += 50) await env.DB.batch(statements.slice(index, index + 50));
  const ids = rows.map((row) => String(row.id));
  const lookupClauses = [`"id" IN (${ids.map(() => "?").join(", ")})`];
  const lookupBinds: unknown[] = [...ids];
  const conflictTarget = resolvedConflictTarget;
  if (upsert && conflictTarget) {
    const conflictParts = conflictTarget.split(",").map((column) => column.trim());
    rows.forEach((row) => {
      lookupClauses.push(`(${conflictParts.map((column) => `"${column}" = ?`).join(" AND ")})`);
      lookupBinds.push(...conflictParts.map((column) => dbValue(column, row[column])));
    });
  }
  const selected = await dbStatement(env.DB, `SELECT ${config.columns.map((column) => `"${column}"`).join(", ")} FROM "${table}" WHERE ${lookupClauses.join(" OR ")}`, lookupBinds).all<Row>();
  return selected.results.map((row) => cleanRow(table, row));
}

async function ensureAdministratorRemains(env: Env, where: { sql: string; binds: unknown[] }, removingAdmin: boolean) {
  if (!removingAdmin) return;
  const targeted = await dbStatement(env.DB, `SELECT COUNT(*) AS count FROM user_roles WHERE ${where.sql} AND role = 'admin'`, where.binds).first<{ count: number }>();
  const removed = Number(targeted?.count ?? 0);
  if (!removed) return;
  const total = await dbStatement(env.DB, "SELECT COUNT(*) AS count FROM user_roles WHERE role = 'admin'").first<{ count: number }>();
  if (Number(total?.count ?? 0) - removed < 1) throw new ConflictError("At least one administrator must remain");
}

async function replaceUserRoles(env: Env, where: { sql: string; binds: unknown[] }, role: Role) {
  const targets = await dbStatement(env.DB, `SELECT DISTINCT user_id FROM user_roles WHERE ${where.sql} LIMIT 100`, where.binds).all<{ user_id: string }>();
  const userIds = targets.results.map((row) => String(row.user_id)).filter(Boolean);
  if (userIds.length === 0) return userIds;
  if (role !== "admin") {
    const placeholders = userIds.map(() => "?").join(", ");
    const targeted = await dbStatement(env.DB, `SELECT COUNT(*) AS count FROM user_roles WHERE user_id IN (${placeholders}) AND role = 'admin'`, userIds).first<{ count: number }>();
    const total = await dbStatement(env.DB, "SELECT COUNT(*) AS count FROM user_roles WHERE role = 'admin'").first<{ count: number }>();
    if (Number(total?.count ?? 0) - Number(targeted?.count ?? 0) < 1) throw new ConflictError("At least one administrator must remain");
  }
  const timestamp = nowIso();
  const statements = userIds.flatMap((userId) => [
    dbStatement(env.DB, "DELETE FROM user_roles WHERE user_id = ?", [userId]),
    dbStatement(env.DB, "INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, ?)", [id(), userId, role, timestamp]),
  ]);
  for (let index = 0; index < statements.length; index += 50) await env.DB.batch(statements.slice(index, index + 50));
  return userIds;
}

async function handleDataWrite(request: Request, env: Env, requestId: string, table: string, auth: AuthContext | null) {
  const config = tableConfig[table];
  if (!config) return errorResponse(request, env, requestId, "Resource not found", 404, "RESOURCE_NOT_FOUND");
  if (!auth) throw new AuthError("Authentication required", 401);
  if (table === "activity_feed" || table === "analytics_events") throw new AuthError("This resource is server-managed", 403);
  const writeRateLimit = table === "comments" ? 30 : table === "reactions" ? 120 : table === "user_follows" ? 60 : 0;
  if (request.method === "POST" && writeRateLimit > 0 && !(await rateLimit(env.DB, request, `data-${table}-${auth.user.id}`, writeRateLimit))) return errorResponse(request, env, requestId, "Too many requests. Please try again later.", 429, "RATE_LIMITED");
  const body = request.method === "DELETE" ? {} : object(await bodyJson(request));
  const values = body.values === undefined ? body : body.values;
  const filters = request.method === "DELETE" ? filtersFromUrl(new URL(request.url), table) : filtersFromBody(body.filters, table);
  if (table === "contact_messages" && !auth.isAdmin) throw new AuthError("Administrator access required", 403);
  if (request.method === "POST") {
    if (table === "user_roles") throw new ValidationError("Roles must be changed through the role management operation");
    const candidates = Array.isArray(values) ? values : [values];
    if (body.onConflict !== undefined && typeof body.onConflict !== "string") throw new ValidationError("onConflict must be text");
    const isUpsert = body.operation === "upsert" || body.onConflict !== undefined || table === "site_settings" || table === "user_settings";
    const rows = await insertRows(env, table, candidates, auth, isUpsert, typeof body.onConflict === "string" ? body.onConflict : undefined);
    return jsonResponse(request, env, requestId, body.single ? rows[0] : rows, 201);
  }
  if (filters.length === 0) throw new ValidationError("A target filter is required for this operation");
  const moderatorCanManage = request.method === "DELETE" && (table === "comments" || table === "reactions");
  const where = buildWhere(table, filters, auth, "write", moderatorCanManage);
  if (request.method === "DELETE") {
    if (table === "user_roles") await ensureAdministratorRemains(env, where, true);
    await dbStatement(env.DB, `DELETE FROM "${table}" WHERE ${where.sql}`, where.binds).run();
    return jsonResponse(request, env, requestId, null, 204);
  }
  const valuesObject = object(values);
  if (table === "profiles" && "email" in valuesObject) throw new ValidationError("Profile email is managed through account settings");
  const settingFilter = filters.find((filter): filter is Extract<Filter, { kind: "eq" }> => filter.kind === "eq" && filter.field === "key");
  const settingKey = table === "site_settings" && typeof settingFilter?.value === "string" ? settingFilter.value : undefined;
  validatePatch(table, valuesObject, settingKey);
  if (table === "experiences") await validateExperiencePatchDateOrder(env, where, valuesObject);
  if (table === "user_roles" && valuesObject.role !== undefined) {
    if (!auth.isAdmin) throw new AuthError("Administrator access required", 403);
    const role = valuesObject.role;
    if (!validRoles.has(String(role) as Role)) throw new ValidationError("Invalid role");
    const userIds = await replaceUserRoles(env, where, role as Role);
    const selectedRows = userIds.length === 0 ? [] : (await dbStatement(env.DB, `SELECT ${config.columns.map((column) => `"${column}"`).join(", ")} FROM "${table}" WHERE user_id IN (${userIds.map(() => "?").join(", ")})`, userIds).all<Row>()).results.map((row) => cleanRow(table, row));
    if (body.single) {
      if (selectedRows.length !== 1) return errorResponse(request, env, requestId, "No rows found", 406, "PGRST116");
      return jsonResponse(request, env, requestId, selectedRows[0]);
    }
    return jsonResponse(request, env, requestId, selectedRows);
  }
  const allowed = tableAllowedColumns(table);
  const immutable = new Set(["id", "user_id", "created_at", "updated_at", "parent_id"]);
  const entries = Object.entries(valuesObject).filter(([field, value]) => allowed.has(field) && !immutable.has(field) && value !== undefined);
  if (entries.length === 0) throw new ValidationError("No editable fields were provided");
  if (table === "user_roles" && !auth.isAdmin) throw new AuthError("Administrator access required", 403);
  if (table === "site_settings" && !auth.isAdmin) throw new AuthError("Administrator access required", 403);
  const assignments = entries.map(([field]) => `"${field}" = ?`);
  const valuesToBind = entries.map(([field, value]) => dbValue(field, value));
  if (config.columns.includes("updated_at")) {
    assignments.push("\"updated_at\" = ?");
    valuesToBind.push(nowIso());
  }
  await dbStatement(env.DB, `UPDATE "${table}" SET ${assignments.join(", ")} WHERE ${where.sql}`, [...valuesToBind, ...where.binds]).run();
  let selectedRows = (await dbStatement(env.DB, `SELECT ${config.columns.map((column) => `"${column}"`).join(", ")} FROM "${table}" WHERE ${where.sql}`, where.binds).all<Row>()).results.map((row) => cleanRow(table, row));
  if (table === "profiles" && auth) selectedRows = await attachProfileEmails(env, selectedRows);
  if (body.single) {
    if (selectedRows.length !== 1) return errorResponse(request, env, requestId, "No rows found", 406, "PGRST116");
    return jsonResponse(request, env, requestId, selectedRows[0]);
  }
  return jsonResponse(request, env, requestId, selectedRows);
}

class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
class ConflictError extends Error {}

async function handleAdminUsers(request: Request, env: Env, requestId: string, auth: AuthContext | null) {
  if (!auth?.isAdmin) throw new AuthError("Administrator access required", 403);
  const users = await dbStatement(env.DB, `SELECT u.id, u.email, u.created_at, u.last_sign_in_at, u.full_name,
    CASE WHEN EXISTS (SELECT 1 FROM user_roles ar WHERE ar.user_id = u.id AND ar.role = 'admin') THEN 'admin'
         WHEN EXISTS (SELECT 1 FROM user_roles mr WHERE mr.user_id = u.id AND mr.role = 'moderator') THEN 'moderator'
         ELSE 'user' END AS role
    FROM users u ORDER BY u.created_at DESC LIMIT 100`).all<Row>();
  return jsonResponse(request, env, requestId, { users: users.results.map((row) => ({ ...userFromRow(row), created_at: row.created_at, last_sign_in_at: row.last_sign_in_at })) });
}

async function handleContact(request: Request, env: Env, requestId: string, auth: AuthContext | null) {
  if (!rateLimit(env.DB, request, "contact", 5)) return errorResponse(request, env, requestId, "Too many messages. Please try again later.", 429, "RATE_LIMITED");
  const body = object(await bodyJson(request));
  const row = normalizeWrite("contact_messages", body, auth);
  await insertRows(env, "contact_messages", [row], auth, false);
  return jsonResponse(request, env, requestId, null, 201);
}

async function handleGeocode(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "geocode", 20)) return errorResponse(request, env, requestId, "Too many location requests. Try again later.", 429, "RATE_LIMITED");
  const address = text(new URL(request.url).searchParams.get("address"), "address", 200);
  let upstream: Response;
  try {
    upstream = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address ?? "")}`, { headers: { Accept: "application/json", "User-Agent": "Portify portfolio map/1.0" } });
  } catch {
    return errorResponse(request, env, requestId, "Location lookup is temporarily unavailable", 502, "GEOCODE_UPSTREAM_FAILED");
  }
  if (!upstream.ok) return errorResponse(request, env, requestId, "Location lookup is temporarily unavailable", 502, "GEOCODE_UPSTREAM_FAILED");
  let results: Array<{ lat?: string; lon?: string; display_name?: string }>;
  try {
    const payload = await upstream.json() as unknown;
    if (!Array.isArray(payload)) throw new Error("invalid geocoder payload");
    results = payload as Array<{ lat?: string; lon?: string; display_name?: string }>;
  } catch {
    return errorResponse(request, env, requestId, "Location lookup is temporarily unavailable", 502, "GEOCODE_UPSTREAM_FAILED");
  }
  const first = results[0];
  const lat = Number(first?.lat);
  const lon = Number(first?.lon);
  if (!first || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return errorResponse(request, env, requestId, "Location could not be found", 404, "LOCATION_NOT_FOUND");
  const label = typeof first.display_name === "string" ? first.display_name.slice(0, 300) : address;
  return jsonResponse(request, env, requestId, { latitude: lat, longitude: lon, label }, 200, { "Cache-Control": "public, max-age=86400" });
}

async function handleGithub(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "github", 30)) return errorResponse(request, env, requestId, "Too many GitHub requests. Try again later.", 429, "RATE_LIMITED");
  const url = new URL(request.url);
  const username = url.searchParams.get("username")?.trim() ?? "";
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) throw new ValidationError("Enter a valid GitHub username");
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "Portify-Worker" };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  let response: Response;
  try {
    response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?type=public&per_page=100&sort=updated`, { headers });
  } catch {
    return errorResponse(request, env, requestId, "GitHub is temporarily unavailable", 502, "GITHUB_UPSTREAM_ERROR");
  }
  if (response.status === 404) return errorResponse(request, env, requestId, "GitHub user not found", 404, "GITHUB_NOT_FOUND");
  if (!response.ok) return errorResponse(request, env, requestId, "GitHub is temporarily unavailable", 502, "GITHUB_UPSTREAM_ERROR");
  let payload: unknown;
  try { payload = await response.json() as unknown; } catch { return errorResponse(request, env, requestId, "GitHub returned an invalid response", 502, "GITHUB_UPSTREAM_ERROR"); }
  if (!Array.isArray(payload)) return errorResponse(request, env, requestId, "GitHub returned an invalid response", 502, "GITHUB_UPSTREAM_ERROR");
  const repositories = payload.flatMap((repo) => {
    if (!repo || typeof repo !== "object" || Array.isArray(repo)) return [];
    const item = repo as Row;
    const repositoryId = Number(item.id);
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 100) : "";
    const htmlUrl = typeof item.html_url === "string" ? item.html_url : "";
    let parsedUrl: URL;
    try { parsedUrl = new URL(htmlUrl); } catch { return []; }
    if (item.private === true || !Number.isSafeInteger(repositoryId) || !name || parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "github.com") return [];
    const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    return [{
      id: repositoryId,
      name,
      full_name: typeof item.full_name === "string" ? item.full_name.slice(0, 200) : name,
      description: typeof item.description === "string" ? item.description.slice(0, 500) : null,
      html_url: htmlUrl,
      stargazers_count: numberValue(item.stargazers_count),
      forks_count: numberValue(item.forks_count),
      language: typeof item.language === "string" ? item.language.slice(0, 80) : null,
      updated_at: typeof item.updated_at === "string" ? item.updated_at : nowIso(),
      topics: Array.isArray(item.topics) ? item.topics.filter((topic): topic is string => typeof topic === "string").map((topic) => topic.slice(0, 40)).slice(0, 20) : [],
      visibility: item.private === true ? "private" : "public",
    }];
  });
  return jsonResponse(request, env, requestId, repositories, 200, { "Cache-Control": "public, max-age=300" });
}

async function handlePageView(request: Request, env: Env, requestId: string) {
  if (!rateLimit(env.DB, request, "pageview", 60)) return jsonResponse(request, env, requestId, null, 202);
  const body = object(await bodyJson(request));
  const rawPathname = text(body.pathname, "pathname", 200);
  const pathname = rawPathname?.split(/[?#]/, 1)[0] ?? "";
  if (!pathname.startsWith("/") || pathname.length > 200) throw new ValidationError("pathname must be a site path");
  const userAgent = request.headers.get("User-Agent") ?? "";
  const device = /mobile/i.test(userAgent) ? "Mobile" : /tablet|ipad/i.test(userAgent) ? "Tablet" : "Desktop";
  const rawReferrer = text(body.referrer ?? request.headers.get("Referer") ?? "", "referrer", 500, false) ?? "";
  let referrer = "";
  try {
    const parsed = new URL(rawReferrer);
    referrer = `${parsed.origin}${parsed.pathname}`.slice(0, 500);
  } catch {
    referrer = rawReferrer.startsWith("/") ? rawReferrer.split(/[?#]/, 1)[0].slice(0, 500) : "";
  }
  const country = (request.headers.get("CF-IPCountry")?.slice(0, 2) ?? "unknown").toUpperCase();
  await dbStatement(env.DB, "INSERT INTO analytics_events (id, pathname, referrer, device, country, created_at) VALUES (?, ?, ?, ?, ?, ?)", [id(), pathname, referrer, device, country, nowIso()]).run();
  return jsonResponse(request, env, requestId, null, 202);
}

function dateRangeDays(value: string | null) {
  if (value === "30days") return 30;
  if (value === "90days") return 90;
  return 7;
}

async function handleAnalytics(request: Request, env: Env, requestId: string, auth: AuthContext | null) {
  if (!auth?.isAdmin) throw new AuthError("Administrator access required", 403);
  const url = new URL(request.url);
  const days = dateRangeDays(url.searchParams.get("range"));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const totals = await dbStatement(env.DB, "SELECT COUNT(*) AS page_views, COUNT(DISTINCT country || ':' || device) AS unique_visitors FROM analytics_events WHERE created_at >= ?", [since]).first<Row>();
  const daily = await dbStatement(env.DB, "SELECT date(created_at) AS date, COUNT(*) AS page_views FROM analytics_events WHERE created_at >= ? GROUP BY date(created_at) ORDER BY date(created_at)", [since]).all<Row>();
  const pages = await dbStatement(env.DB, "SELECT pathname AS name, COUNT(*) AS views FROM analytics_events WHERE created_at >= ? GROUP BY pathname ORDER BY views DESC LIMIT 10", [since]).all<Row>();
  const devices = await dbStatement(env.DB, "SELECT device AS name, COUNT(*) AS users FROM analytics_events WHERE created_at >= ? GROUP BY device ORDER BY users DESC", [since]).all<Row>();
  const referrers = await dbStatement(env.DB, "SELECT CASE WHEN referrer IS NULL OR referrer = '' THEN 'Direct' ELSE referrer END AS name, COUNT(*) AS value FROM analytics_events WHERE created_at >= ? GROUP BY name ORDER BY value DESC LIMIT 10", [since]).all<Row>();
  return jsonResponse(request, env, requestId, {
    rangeDays: days,
    totalVisitors: Number(totals?.unique_visitors ?? 0),
    pageViews: Number(totals?.page_views ?? 0),
    daily: daily.results,
    pages: pages.results,
    devices: devices.results,
    referrers: referrers.results,
  });
}

async function handleDashboardStats(request: Request, env: Env, requestId: string, auth: AuthContext | null) {
  if (!auth) throw new AuthError("Authentication required", 401);
  const userId = auth.user.id;
  const count = async (table: string, where = "user_id = ?", values: unknown[] = [userId]) => Number((await dbStatement(env.DB, `SELECT COUNT(*) AS count FROM "${table}" WHERE ${where}`, values).first<{ count: number }>())?.count ?? 0);
  const [projects, skills, experiences, blogPosts] = await Promise.all([
    count("projects"), count("skills"), count("experiences"), count("blog_posts"),
  ]);
  const messages = auth.isAdmin ? await count("contact_messages", "1 = 1", []) : 0;
  const unreadMessages = auth.isAdmin ? await count("contact_messages", "read = 0", []) : 0;
  return jsonResponse(request, env, requestId, { projects, skills, experiences, blogPosts, messages, unreadMessages });
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.batch([
      dbStatement(env.DB, "DELETE FROM api_rate_limits WHERE reset_at < ?", [now - 3600]),
      dbStatement(env.DB, "DELETE FROM sessions WHERE expires_at <= ?", [now]),
      dbStatement(env.DB, "DELETE FROM password_reset_tokens WHERE expires_at <= ?", [now]),
    ]);
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(request, env, requestId) });
      const originError = request.method !== "GET" && request.method !== "HEAD" ? validateOrigin(request, env, requestId) : null;
      if (originError) return originError;
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
      const auth = await getAuth(request, env);

      if (path === "/health" && request.method === "GET") {
        await dbStatement(env.DB, "SELECT 1 AS ok").first();
        return jsonResponse(request, env, requestId, { status: "ok", service: "portify-api", timestamp: nowIso() }, 200, { "Cache-Control": "no-store" });
      }
      if (path === "/auth/session" && request.method === "GET") return authSessionResponse(request, env, requestId, auth);
      if (path === "/auth/signup" && request.method === "POST") return await handleSignup(request, env, requestId);
      if (path === "/auth/login" && request.method === "POST") return await handleLogin(request, env, requestId);
      if (path === "/admin/bootstrap" && request.method === "POST") return await handleAdminBootstrap(request, env, requestId);
      if (path === "/auth/logout" && request.method === "POST") return await handleLogout(request, env, requestId);
      if (path === "/auth/reset" && request.method === "POST") return await handlePasswordResetRequest(request, env, requestId);
      if (path === "/auth/reset/complete" && request.method === "POST") return await handlePasswordResetComplete(request, env, requestId);
      if (path === "/auth/update" && request.method === "POST") return await handleUpdateAuth(request, env, requestId, auth);
      if (path === "/admin/users" && request.method === "GET") return await handleAdminUsers(request, env, requestId, auth);
      if (path === "/contact" && request.method === "POST") return await handleContact(request, env, requestId, auth);
      if (path === "/functions/contact-submit" && request.method === "POST") return await handleContact(request, env, requestId, auth);
      if (path === "/geocode" && request.method === "GET") return await handleGeocode(request, env, requestId);
      if (path === "/github/repositories" && request.method === "GET") return await handleGithub(request, env, requestId);
      if (path === "/analytics/pageview" && request.method === "POST") return await handlePageView(request, env, requestId);
      if (path === "/analytics" && request.method === "GET") return await handleAnalytics(request, env, requestId, auth);
      if (path === "/dashboard/stats" && request.method === "GET") return await handleDashboardStats(request, env, requestId, auth);
      if (path.startsWith("/data/")) {
        const table = decodeURIComponent(path.slice("/data/".length));
        if (request.method === "GET") return await handleDataRead(request, env, requestId, table, auth);
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return await handleDataWrite(request, env, requestId, table, auth);
      }
      return errorResponse(request, env, requestId, "Route not found", 404, "NOT_FOUND");
    } catch (error) {
      if (error instanceof ValidationError) return errorResponse(request, env, requestId, error.message, 422, "VALIDATION_ERROR");
      if (error instanceof ConflictError) return errorResponse(request, env, requestId, error.message, 409, "CONFLICT");
      if (error instanceof AuthError) return errorResponse(request, env, requestId, error.message, error.status, error.status === 401 ? "AUTH_REQUIRED" : "FORBIDDEN");
      const databaseMessage = error instanceof Error ? error.message : String(error);
      if (/UNIQUE constraint failed/i.test(databaseMessage)) return errorResponse(request, env, requestId, "This record conflicts with an existing record", 409, "CONFLICT");
      if (/CHECK constraint failed|FOREIGN KEY constraint failed/i.test(databaseMessage)) return errorResponse(request, env, requestId, "The submitted data is invalid", 422, "VALIDATION_ERROR");
      console.error(JSON.stringify({ requestId, error: databaseMessage }));
      return errorResponse(request, env, requestId, "An unexpected server error occurred", 500, "INTERNAL_ERROR");
    }
  },
};
