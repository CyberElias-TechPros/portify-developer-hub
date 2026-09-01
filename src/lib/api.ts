import type { Database, Json } from "@/types/database";

/**
 * The browser only talks to the Portify Worker.  Keeping the small query
 * adapter here lets the existing screens share one typed transport while the
 * backend remains a normal REST API backed by Cloudflare D1.
 */
export type ApiError = {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
  details?: unknown;
};

export type ApiResult<T> = {
  data: T | null;
  error: ApiError | null;
  count?: number;
};

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  role?: "admin" | "moderator" | "user";
};

export type AuthSession = {
  user: AuthUser;
  // Tokens are deliberately not exposed to JavaScript. Authentication uses a
  // Secure, HttpOnly cookie issued by the Worker.
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export type JsonObject = { [key: string]: Json | undefined };

type ExtraTables = {
  portfolio_themes: {
    Row: { id: string; user_id: string; settings: Json; created_at: string | null; updated_at: string | null };
    Insert: { id?: string; user_id: string; settings: Json; created_at?: string | null; updated_at?: string | null };
    Update: { id?: string; user_id?: string; settings?: Json; created_at?: string | null; updated_at?: string | null };
  };
  resume_documents: {
    Row: { id: string; user_id: string; name: string; template: string; content: Json; created_at: string | null; updated_at: string | null };
    Insert: { id?: string; user_id: string; name: string; template?: string; content: Json; created_at?: string | null; updated_at?: string | null };
    Update: { id?: string; user_id?: string; name?: string; template?: string; content?: Json; created_at?: string | null; updated_at?: string | null };
  };
};
type PublicTables = Database["public"]["Tables"] & ExtraTables;
type TableName = keyof PublicTables;
type TableRow<K extends TableName> = PublicTables[K]["Row"];
type ProfileRow = PublicTables["profiles"]["Row"];
type CommentRow = PublicTables["comments"]["Row"] & {
  user?: ProfileRow | ProfileRow[] | null;
};
type RowFor<K extends TableName> = K extends "comments" ? CommentRow : TableRow<K>;

type Filter =
  | { kind: "eq"; field: string; value: string | number | boolean | null }
  | { kind: "in"; field: string; values: Array<string | number | boolean> }
  | { kind: "not"; field: string; operator: "is" | "neq"; value: string | number | boolean | null };

type QueryState = {
  table: string;
  operation: "select" | "insert" | "update" | "delete" | "upsert";
  select: string;
  filters: Filter[];
  order: Array<{ field: string; ascending: boolean }>;
  limit?: number;
  values?: unknown;
  onConflict?: string;
  single: boolean;
  maybeSingle: boolean;
  count?: "exact";
};

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
const API_BASE_URL = configuredApiBase
  ? `${configuredApiBase.endsWith("/api") ? configuredApiBase : `${configuredApiBase}/api`}`
  : "/api";

const authListeners = new Set<
  (event: string, session: AuthSession | null) => void
>();
let cachedSession: AuthSession | null = null;

function toError(error: unknown, fallback = "Something went wrong"): ApiError {
  if (error && typeof error === "object" && "message" in error) {
    const candidate = error as { message?: unknown; code?: unknown; status?: unknown };
    return {
      message: typeof candidate.message === "string" ? candidate.message : fallback,
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      status: typeof candidate.status === "number" ? candidate.status : undefined,
    };
  }
  return { message: fallback };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Portify-Client", "web");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
    const requestId = response.headers.get("x-request-id") ?? undefined;
    const headerCount = response.headers.get("x-total-count");
    const responseCount = headerCount !== null && /^\d+$/.test(headerCount) ? Number(headerCount) : undefined;
    let payload: { data?: T; error?: ApiError; count?: number } | null = null;
    if (response.status !== 204) {
      try {
        payload = (await response.json()) as { data?: T; error?: ApiError; count?: number };
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const error = payload?.error ?? {
        message: response.statusText || "Request failed",
        status: response.status,
      };
      return {
        data: null,
        count: payload?.count ?? responseCount,
        error: { ...error, status: error.status ?? response.status, requestId },
      };
    }

    return {
      data: payload?.data === undefined ? null : payload.data,
      count: payload?.count ?? responseCount,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        ...toError(error, "Unable to reach the Portify API"),
        code: "NETWORK_ERROR",
      },
    };
  }
}

function cloneState(state: QueryState): QueryState {
  return {
    ...state,
    filters: [...state.filters],
    order: [...state.order],
  };
}

export class ApiQuery<T extends object, Single extends boolean = false>
  implements PromiseLike<ApiResult<Single extends true ? T : T[]>>
{
  private readonly state: QueryState;

  constructor(table: string, state?: Partial<QueryState>) {
    this.state = {
      table,
      operation: "select",
      select: "*",
      filters: [],
      order: [],
      single: false,
      maybeSingle: false,
      ...state,
    };
  }

  select(columns = "*", options?: { count?: "exact" }): ApiQuery<T, Single> {
    this.state.select = columns || "*";
    if (options?.count) this.state.count = options.count;
    return this;
  }

  insert(values: unknown): ApiQuery<T, false> {
    const next = cloneState(this.state);
    next.operation = "insert";
    next.values = values;
    next.single = false;
    return new ApiQuery<T, false>(this.state.table, next);
  }

  update(values: unknown): ApiQuery<T, false> {
    const next = cloneState(this.state);
    next.operation = "update";
    next.values = values;
    next.single = false;
    return new ApiQuery<T, false>(this.state.table, next);
  }

  upsert(values: unknown, options?: { onConflict?: string }): ApiQuery<T, false> {
    const next = cloneState(this.state);
    next.operation = "upsert";
    next.values = values;
    next.onConflict = options?.onConflict;
    next.single = false;
    return new ApiQuery<T, false>(this.state.table, next);
  }

  delete(): ApiQuery<T, false> {
    const next = cloneState(this.state);
    next.operation = "delete";
    next.single = false;
    return new ApiQuery<T, false>(this.state.table, next);
  }

  eq(field: string, value: string | number | boolean | null): this {
    this.state.filters.push({ kind: "eq", field, value });
    return this;
  }

  in(field: string, values: Array<string | number | boolean>): this {
    this.state.filters.push({ kind: "in", field, values });
    return this;
  }

  not(field: string, operator: "is" | "neq", value: string | number | boolean | null): this {
    this.state.filters.push({ kind: "not", field, operator, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    this.state.order.push({ field, ascending: options?.ascending !== false });
    return this;
  }

  limit(value: number): this {
    this.state.limit = Math.max(1, Math.min(100, Math.floor(value)));
    return this;
  }

  single(): ApiQuery<T, true> {
    const next = cloneState(this.state);
    next.single = true;
    return new ApiQuery<T, true>(this.state.table, next);
  }

  maybeSingle(): ApiQuery<T, true> {
    const next = cloneState(this.state);
    next.single = true;
    next.maybeSingle = true;
    return new ApiQuery<T, true>(this.state.table, next);
  }

  private async execute(): Promise<ApiResult<Single extends true ? T : T[]>> {
    const state = this.state;
    const params = new URLSearchParams();
    params.set("select", state.select);
    if (state.single) params.set("single", "true");
    if (state.maybeSingle) params.set("maybeSingle", "true");
    if (state.count) params.set("count", state.count);
    if (state.limit) params.set("limit", String(state.limit));
    state.filters.forEach((filter) => {
      if (filter.kind === "eq") {
        params.set(`eq_${filter.field}`, filter.value === null ? "null" : String(filter.value));
      } else if (filter.kind === "in") {
        params.set(`in_${filter.field}`, JSON.stringify(filter.values));
      } else {
        params.set(`not_${filter.field}`, `${filter.operator}.${filter.value ?? "null"}`);
      }
    });
    state.order.forEach((item) => {
      params.append("order", `${item.field}.${item.ascending ? "asc" : "desc"}`);
    });

    const method = state.operation === "select" ? "GET" : state.operation === "delete" ? "DELETE" : state.operation === "update" ? "PATCH" : "POST";
    const body = state.operation === "select" || state.operation === "delete"
      ? undefined
      : JSON.stringify({
          values: state.values,
          operation: state.operation,
          onConflict: state.onConflict,
          select: state.select,
          single: state.single,
          filters: state.filters,
        });
    const suffix = method === "GET" || method === "DELETE" ? `?${params.toString()}` : "";
    const result = await request<Single extends true ? T : T[]>(
      `/data/${encodeURIComponent(state.table)}${suffix}`,
      { method, body },
    );
    if (state.single && (result.error?.status === 404 || result.error?.status === 406)) result.error.code = "PGRST116";
    return result;
  }

  then<TResult1 = ApiResult<Single extends true ? T : T[]>, TResult2 = never>(
    onfulfilled?: ((value: ApiResult<Single extends true ? T : T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function emitAuth(event: string, session: AuthSession | null) {
  cachedSession = session;
  authListeners.forEach((listener) => listener(event, session));
}

const auth = {
  async getSession(): Promise<ApiResult<{ session: AuthSession | null }>> {
    const result = await request<{ session: AuthSession | null }>("/auth/session");
    if (!result.error) {
      cachedSession = result.data?.session ?? null;
    }
    return result;
  },

  async getUser(): Promise<ApiResult<{ user: AuthUser | null }>> {
    const result = await request<{ user: AuthUser | null }>("/auth/session");
    if (!result.error) {
      cachedSession = result.data?.user
        ? {
            user: result.data.user,
            access_token: "",
            refresh_token: "",
          }
        : null;
    }
    return { ...result, data: { user: result.data?.user ?? null } };
  },

  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    authListeners.add(callback);
    if (cachedSession) callback("INITIAL_SESSION", cachedSession);
    return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
  },

  async signUp(credentials: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    const result = await request<{ user: AuthUser; session: AuthSession | null }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        metadata: credentials.options?.data ?? {},
      }),
    });
    if (!result.error && result.data?.session) emitAuth("SIGNED_IN", result.data.session);
    return result;
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    const result = await request<{ user: AuthUser; session: AuthSession }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (!result.error && result.data?.session) emitAuth("SIGNED_IN", result.data.session);
    return result;
  },

  async signOut() {
    const result = await request<null>("/auth/logout", { method: "POST", body: "{}" });
    if (!result.error) emitAuth("SIGNED_OUT", null);
    return result;
  },

  async resetPasswordForEmail(email: string) {
    return request<null>("/auth/reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async completePasswordReset(token: string, password: string) {
    return request<null>("/auth/reset/complete", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  async updateUser(values: { email?: string; password?: string; current_password?: string }) {
    const result = await request<{ user: AuthUser }>("/auth/update", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!result.error && result.data?.user && cachedSession) {
      emitAuth("USER_UPDATED", { ...cachedSession, user: result.data.user });
    }
    return result;
  },

  async signInWithOAuth(_provider: "github" | "linkedin") {
    return {
      data: null,
      error: {
        code: "OAUTH_NOT_CONFIGURED",
        message: "OAuth is not configured for this deployment.",
      } satisfies ApiError,
    };
  },

  admin: {
    async listUsers() {
      return request<{ users: AuthUser[] }>("/admin/users");
    },
  },
};

const functions = {
  async invoke<T = unknown>(name: string, options: { body?: unknown } = {}) {
    return request<T>(`/functions/${encodeURIComponent(name)}`, {
      method: "POST",
      body: JSON.stringify(options.body ?? {}),
    });
  },
};

export const supabase = {
  from<K extends TableName>(table: K): ApiQuery<RowFor<K>, false> {
    return new ApiQuery<RowFor<K>, false>(String(table));
  },
  auth,
  functions,
};

export const api = {
  request,
  auth,
  functions,
  get session() {
    return cachedSession;
  },
};

export type { Json };
