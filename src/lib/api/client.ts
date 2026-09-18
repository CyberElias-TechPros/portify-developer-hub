/**
 * Portify API client — talks to the Cloudflare Worker at /api.
 *
 * The surface mirrors the ergonomics the app was originally written against
 * (`db.from('projects').select('*').eq('user_id', id).order(...)`) so every
 * data call stays terse and typed, while the implementation is plain REST
 * against our own Workers + D1 backend.
 */

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface QueryResult<T> {
  data: T | null;
  error: ApiError | null;
  count?: number | null;
  status?: number;
}

export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  profile?: Record<string, any> | null;
}

export interface Session {
  access_token?: string;
  expires_at?: string;
  user: SessionUser | null;
}

type FilterOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'is'
  | 'contains';

export interface QueryBuilder<T = any> extends PromiseLike<QueryResult<T | T[]>> {
  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): QueryBuilder<T>;
  insert(values: Partial<T> | Partial<T>[]): QueryBuilder<T>;
  update(values: Partial<T>): QueryBuilder<T>;
  upsert(values: Partial<T> | Partial<T>[], options?: { onConflict?: string }): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  neq(column: string, value: unknown): QueryBuilder<T>;
  gt(column: string, value: unknown): QueryBuilder<T>;
  gte(column: string, value: unknown): QueryBuilder<T>;
  lt(column: string, value: unknown): QueryBuilder<T>;
  lte(column: string, value: unknown): QueryBuilder<T>;
  like(column: string, value: string): QueryBuilder<T>;
  ilike(column: string, value: string): QueryBuilder<T>;
  in(column: string, value: readonly unknown[]): QueryBuilder<T>;
  is(column: string, value: null | boolean): QueryBuilder<T>;
  contains(column: string, value: string): QueryBuilder<T>;
  not(column: string, operator: string, value: unknown): QueryBuilder<T>;
  or(filters: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  range(from: number, to: number): QueryBuilder<T>;
  single(): QueryBuilder<T>;
  maybeSingle(): QueryBuilder<T>;
  match(criteria: Record<string, unknown>): QueryBuilder<T>;
}

const API_BASE = (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const TOKEN_KEY = 'portify.session.token';

let authToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export function setAuthToken(token: string | null) {
  authToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage may be unavailable (private mode) */
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function request<T = any>(
  path: string,
  init: RequestInit & { raw?: boolean } = {}
): Promise<{ data: T | null; error: ApiError | null; status: number; count?: number | null }> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  headers.set('X-Client-Info', 'portify-web');

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    return {
      data: null,
      error: { message: 'Network unavailable — check your connection and try again.', code: 'network_error' },
      status: 0,
    };
  }

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = payload?.error ?? {
      message: response.statusText || 'Request failed',
      code: 'http_error',
    };
    return { data: null, error, status: response.status, count: null };
  }

  if (init.raw) return { data: payload as T, error: null, status: response.status, count: payload?.count ?? null };

  return {
    data: (payload?.data ?? payload) as T,
    error: payload?.error ?? null,
    status: response.status,
    count: payload?.count ?? null,
  };
}

class Query<T = any> implements QueryBuilder<T> {
  private table: string;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private filters: Array<[string, string]> = [];
  private orderClauses: string[] = [];
  private selectClause = '*';
  private embeds: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private wantCount = false;
  private singleMode: 'none' | 'single' | 'maybe' = 'none';
  private payload?: unknown;
  private onConflict?: string;
  private prefer: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  // ------------------------------------------------------------- commands --
  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (this.method === 'GET') {
      this.method = 'GET';
    } else {
      this.prefer.push('return=representation');
    }
    this.parseSelect(columns);
    if (options?.count) this.wantCount = true;
    return this;
  }

  insert(values: Partial<T> | Partial<T>[]) {
    this.method = 'POST';
    this.payload = values;
    return this;
  }

  update(values: Partial<T>) {
    this.method = 'PATCH';
    this.payload = values;
    return this;
  }

  upsert(values: Partial<T> | Partial<T>[], options?: { onConflict?: string }) {
    this.method = 'POST';
    this.payload = values;
    this.onConflict = options?.onConflict;
    this.prefer.push('resolution=merge-duplicates');
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  // -------------------------------------------------------------- filters --
  private addFilter(column: string, operator: string) {
    if (operator.endsWith('.')) return this;
    this.filters.push([column, operator]);
    return this;
  }

  eq(column: string, value: unknown) {
    return this.addFilter(column, `eq.${serialise(value)}`);
  }
  neq(column: string, value: unknown) {
    return this.addFilter(column, `neq.${serialise(value)}`);
  }
  gt(column: string, value: unknown) {
    return this.addFilter(column, `gt.${serialise(value)}`);
  }
  gte(column: string, value: unknown) {
    return this.addFilter(column, `gte.${serialise(value)}`);
  }
  lt(column: string, value: unknown) {
    return this.addFilter(column, `lt.${serialise(value)}`);
  }
  lte(column: string, value: unknown) {
    return this.addFilter(column, `lte.${serialise(value)}`);
  }
  like(column: string, value: string) {
    return this.addFilter(column, `like.${value}`);
  }
  ilike(column: string, value: string) {
    return this.addFilter(column, `ilike.${value}`);
  }
  in(column: string, value: readonly unknown[]) {
    if (!value?.length) {
      // Nothing can match an empty set.
      this.filters.push([column, 'in.__empty__']);
      return this;
    }
    return this.addFilter(column, `in.${value.map(serialise).join(',')}`);
  }
  is(column: string, value: null | boolean) {
    return this.addFilter(column, `is.${value === null ? 'null' : value}`);
  }
  contains(column: string, value: string) {
    return this.addFilter(column, `contains.${value}`);
  }
  not(column: string, operator: string, value: unknown) {
    return this.addFilter(column, `not.${operator}.${value === null ? 'null' : serialise(value)}`);
  }
  or(filters: string) {
    // `or=(a.eq.1,b.eq.2)` — the Worker understands the same syntax.
    filters
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .forEach((chunk) => {
        const [column, operator, ...rest] = chunk.split('.');
        if (column && operator) this.addFilter(column, `${operator}.${rest.join('.')}`);
      });
    return this;
  }
  match(criteria: Record<string, unknown>) {
    for (const [column, value] of Object.entries(criteria)) this.eq(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderClauses.push(`${column}.${options?.ascending === false ? 'desc' : 'asc'}`);
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = Math.max(to - from + 1, 1);
    return this;
  }

  single() {
    this.singleMode = 'single';
    this.limitValue = 1;
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybe';
    this.limitValue = 1;
    return this;
  }

  // ------------------------------------------------------------ internals --
  private parseSelect(columns: string) {
    if (!columns || columns.includes('*')) {
      this.selectClause = '*';
    } else {
      const plain: string[] = [];
      const embeds: string[] = [];
      for (const raw of splitTopLevel(columns)) {
        const part = raw.trim();
        if (!part) continue;
        if (part.includes(':')) {
          const [alias, rest] = part.split(':');
          const table = rest.split('(')[0].trim();
          embeds.push(`${alias.trim()}:${table}`);
        } else if (part.includes('(')) {
          embeds.push(part.split('(')[0].trim());
        } else if (part !== '*') {
          plain.push(part);
        }
      }
      this.selectClause = plain.length ? plain.join(',') : '*';
      this.embeds.push(...embeds);
    }
  }

  private buildQuery(): string {
    const params = new URLSearchParams();
    if (this.method === 'GET') {
      params.set('select', this.selectClause);
      if (this.embeds.length) params.set('embed', [...new Set(this.embeds)].join(','));
      for (const [column, value] of this.filters) {
        if (value.includes('__empty__')) {
          params.append(`f.${column}`, 'in.');
        } else {
          params.append(`f.${column}`, value);
        }
      }
      if (this.orderClauses.length) params.set('order', this.orderClauses.join(','));
      if (this.limitValue !== undefined) params.set('limit', String(this.limitValue));
      if (this.offsetValue !== undefined) params.set('offset', String(this.offsetValue));
      if (this.wantCount) params.set('count', 'exact');
    } else {
      for (const [column, value] of this.filters) params.append(`f.${column}`, value);
      if (this.onConflict) params.set('on_conflict', this.onConflict);
    }
    const qs = params.toString();
    return `${API_BASE}/api/db/${this.table}${qs ? `?${qs}` : ''}`;
  }

  private async execute(): Promise<QueryResult<T | T[]>> {
    if ((this.method === 'PATCH' || this.method === 'DELETE') && this.filters.length === 0) {
      return {
        data: null,
        error: { message: 'Refusing to run an unfiltered mutation.', code: 'bad_request' },
        status: 400,
        count: null,
      };
    }

    const init: RequestInit = { method: this.method };
    if (this.payload !== undefined && this.method !== 'DELETE') {
      init.body = JSON.stringify(this.payload);
    }
    if (this.prefer.length) init.headers = { Prefer: this.prefer.join(',') };

    const { data, error, status, count } = await request<any>(this.buildQuery(), init as any);

    if (error) {
      return { data: null, error, status, count: null };
    }

    if (this.method === 'GET' || this.method === 'POST' || this.method === 'PATCH') {
      const rows: any[] = Array.isArray(data) ? data : data === null ? [] : [data];
      if (this.singleMode === 'single') {
        if (!rows.length) {
          return { data: null, error: { message: 'Row not found', code: 'PGRST116' }, status: 406, count: 0 };
        }
        return { data: rows[0] as T, error: null, status: status || 200, count: count ?? 1 };
      }
      if (this.singleMode === 'maybe') {
        return { data: (rows[0] ?? null) as T, error: null, status: status || 200, count: count ?? rows.length };
      }
      return { data: rows as T[], error: null, status: status || 200, count };
    }

    return { data: (Array.isArray(data) ? data : []) as T[], error: null, status: status || 200, count };
  }

  then<TResult1 = QueryResult<T | T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T | T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function serialise(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

// -------------------------------------------------------------------- auth --
type AuthListener = (event: string, session: Session | null) => void;
const listeners = new Set<AuthListener>();
let cachedSession: Session | null = null;

async function fetchSession(): Promise<Session | null> {
  const { data } = await request<{ user: any; session: any }>('/api/auth/session');
  if (!data?.user) {
    setAuthToken(null);
    cachedSession = null;
    return null;
  }
  cachedSession = { ...(data.session ?? {}), user: data.user as SessionUser };
  return cachedSession;
}

function emit(event: string, session: Session | null) {
  cachedSession = session;
  listeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (error) {
      console.warn('[auth] listener failed', error);
    }
  });
}

export const auth = {
  async getSession() {
    const session = await fetchSession();
    return { data: { session }, error: null };
  },

  async getUser() {
    if (cachedSession?.user) return { data: { user: cachedSession.user }, error: null };
    const session = await fetchSession();
    return {
      data: { user: session?.user ?? null },
      error: session ? null : { message: 'Not authenticated', code: 'unauthorized' },
    };
  },

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        },
      },
    };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
    const { data, error } = await request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(options?.data ?? {}) }),
    });
    if (error) return { data: { user: null, session: null }, error };
    if (data?.session?.access_token) setAuthToken(data.session.access_token);
    if (data?.user) emit('SIGNED_IN', { ...data.session, user: data.user });
    return { data: { user: data?.user ?? null, session: data?.session ?? null, verificationRequired: data?.verificationRequired }, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { data, error } = await request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (error) return { data: { user: null, session: null }, error };
    if (data?.session?.access_token) setAuthToken(data.session.access_token);
    emit('SIGNED_IN', { ...data.session, user: data.user });
    return { data: { user: data.user, session: data.session }, error: null };
  },

  async signOut() {
    await request('/api/auth/logout', { method: 'POST' });
    setAuthToken(null);
    emit('SIGNED_OUT', null);
    return { error: null };
  },

  async logoutAll() {
    const { error } = await request('/api/auth/logout-all', { method: 'POST' });
    setAuthToken(null);
    if (!error) emit('SIGNED_OUT', null);
    return { error };
  },

  async listSessions() {
    const { data, error } = await request<any[]>('/api/auth/sessions');
    return { data: data ?? [], error };
  },

  async revokeSession(id: string) {
    return request(`/api/auth/sessions/${id}`, { method: 'DELETE' });
  },

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    return request('/api/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email, redirectTo: options?.redirectTo }) });
  },

  async updateUser(payload: {
    email?: string;
    password?: string;
    current_password?: string;
    data?: Record<string, any>;
  }) {
    if (payload.password) {
      const { error } = await request('/api/auth/password/change', {
        method: 'POST',
        body: JSON.stringify({ current_password: payload.current_password ?? '', new_password: payload.password }),
      });
      if (error) return { data: { user: null }, error };
    }
    if (payload.email) {
      const { error } = await request('/api/profile', { method: 'PATCH', body: JSON.stringify({ email: payload.email }) });
      if (error) return { data: { user: null }, error };
    }
    if (payload.data) {
      const { error } = await request('/api/profile', { method: 'PATCH', body: JSON.stringify(payload.data) });
      if (error) return { data: { user: null }, error };
    }
    const session = await fetchSession();
    emit('USER_UPDATED', session);
    return { data: { user: session?.user ?? null }, error: null };
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request('/api/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  async resetPassword(token: string, password: string) {
    return request('/api/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
  },

  signInWithOAuth({ provider, options }: { provider: string; options?: { redirectTo?: string } }) {
    const next = options?.redirectTo ? new URL(options.redirectTo, window.location.origin).pathname : '/profile';
    window.location.href = `${API_BASE}/api/auth/oauth/${provider}?next=${encodeURIComponent(next)}`;
    return { data: { provider, url: `${API_BASE}/api/auth/oauth/${provider}` }, error: null };
  },

  async getProviders() {
    const { data, error } = await request<{ email: boolean; github: boolean; publicSignups: boolean; verificationRequired: boolean }>(
      '/api/auth/providers'
    );
    return { data: data ?? { email: true, github: false, publicSignups: true, verificationRequired: false }, error };
  },

  async acceptOAuthToken(token: string) {
    setAuthToken(token);
    const session = await fetchSession();
    emit('SIGNED_IN', session);
    return session;
  },
};

// ----------------------------------------------------------------- storage --
export const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File, options?: { contentType?: string; upsert?: boolean }) {
        const form = new FormData();
        form.append('file', file);
        form.append('purpose', bucket);
        const { data, error } = await request<any>('/api/media/upload', { method: 'POST', body: form });
        if (error) return { data: null, error };
        return { data: { path: data?.key ?? path, id: data?.id, fullPath: data?.url }, error: null };
      },
      getPublicUrl(path: string) {
        const url = path.startsWith('http') || path.startsWith('data:') ? path : `${API_BASE}/api/media/file/${path}`;
        return { data: { publicUrl: url } };
      },
      async remove(paths: string[]) {
        for (const path of paths) {
          await request(`/api/media/${path}`, { method: 'DELETE' });
        }
        return { data: null, error: null };
      },
    };
  },
  async list() {
    const { data, error } = await request<any[]>('/api/media');
    return { data, error };
  },
};

// --------------------------------------------------------------- functions --
export const functions = {
  async invoke<T = any>(name: string, options?: { body?: unknown }) {
    const map: Record<string, string> = {
      'contact-submit': '/api/contact',
    };
    const path = map[name] ?? `/api/${name}`;
    const { data, error } = await request<T>(path, {
      method: 'POST',
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    if (error) {
      return { data: null, error: Object.assign(new Error(error.message), { context: error }) };
    }
    return { data, error: null };
  },
};

/**
 * Upload a file through the Worker's media pipeline.
 * Returns the public URL to store on the owning record.
 */
export async function uploadMedia(
  file: File,
  purpose = 'general'
): Promise<{ url: string | null; error: ApiError | null }> {
  const form = new FormData();
  form.append('file', file);
  form.append('purpose', purpose);
  const { data, error } = await request<any>('/api/media/upload', { method: 'POST', body: form });
  if (error) return { url: null, error };
  return { url: data?.url ?? null, error: null };
}

// ---------------------------------------------------------------- exports --
export const db = {
  from<T = any>(table: string): QueryBuilder<T> {
    return new Query<T>(table) as unknown as QueryBuilder<T>;
  },
};

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) }),
};

