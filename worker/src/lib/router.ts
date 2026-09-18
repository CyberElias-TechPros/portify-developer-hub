/**
 * Micro router — pattern matching with `:params`, middleware chain, error trapping.
 */
import { fail, HttpError, json } from './http';

export interface RouteContext<E = unknown> {
  req: Request;
  env: E;
  exec: ExecutionContext;
  url: URL;
  params: Record<string, string>;
  query: URLSearchParams;
  /** Lazily parsed JSON body. */
  body: <T = any>() => Promise<T>;
  /** Text body (used by webhooks). */
  text: () => Promise<string>;
  state: Record<string, unknown>;
}

export type Handler<E = unknown> = (c: RouteContext<E>) => Promise<Response> | Response;
export type Middleware<E = unknown> = (c: RouteContext<E>, next: () => Promise<Response>) => Promise<Response> | Response;

interface Route<E> {
  method: string;
  segments: string[];
  handler: Handler<E>;
}

export class Router<E = unknown> {
  private routes: Route<E>[] = [];
  private middleware: Middleware<E>[] = [];

  use(mw: Middleware<E>) {
    this.middleware.push(mw);
    return this;
  }

  add(method: string, path: string, handler: Handler<E>) {
    this.routes.push({
      method: method.toUpperCase(),
      segments: path.split('/').filter(Boolean),
      handler,
    });
    return this;
  }

  get = (path: string, handler: Handler<E>) => this.add('GET', path, handler);
  post = (path: string, handler: Handler<E>) => this.add('POST', path, handler);
  put = (path: string, handler: Handler<E>) => this.add('PUT', path, handler);
  patch = (path: string, handler: Handler<E>) => this.add('PATCH', path, handler);
  delete = (path: string, handler: Handler<E>) => this.add('DELETE', path, handler);

  /** Does any route match this method+path (used for 404 vs 405 detection)? */
  has(pathname: string): boolean {
    const segments = pathname.split('/').filter(Boolean);
    return this.routes.some((r) => matchRoute(r, segments));
  }

  private resolve(method: string, pathname: string): { route: Route<E>; params: Record<string, string> } | null {
    const segments = pathname.split('/').filter(Boolean);
    let pathMatched = false;
    for (const route of this.routes) {
      const params = matchRoute(route, segments);
      if (!params) continue;
      pathMatched = true;
      if (route.method === method) return { route, params };
    }
    if (pathMatched) throw new HttpError(405, `Method ${method} not allowed for ${pathname}`, 'method_not_allowed');
    return null;
  }

  async handle(req: Request, env: E, exec: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    let parsedBody: unknown;
    let bodyParsed = false;

    let resolved: { route: Route<E>; params: Record<string, string> } | null = null;
    let resolveError: unknown = null;
    try {
      resolved = this.resolve(req.method, url.pathname);
    } catch (error) {
      resolveError = error;
    }

    const c: RouteContext<E> = {
      req,
      env,
      exec,
      url,
      params: resolved?.params ?? {},
      query: url.searchParams,
      state: {},
      body: async <T,>() => {
        if (!bodyParsed) {
          bodyParsed = true;
          const contentType = req.headers.get('Content-Type') || '';
          try {
            if (contentType.includes('application/json')) {
              const raw = await req.text();
              parsedBody = raw ? JSON.parse(raw) : {};
            } else if (contentType.includes('form')) {
              const form = await req.formData();
              parsedBody = Object.fromEntries(form.entries());
            } else {
              const raw = await req.text();
              parsedBody = raw ? safeJson(raw) : {};
            }
          } catch {
            throw HttpError.badRequest('Request body must be valid JSON');
          }
        }
        return parsedBody as T;
      },
      text: () => req.clone().text(),
    };

    if (resolveError) return fail(resolveError);
    if (!resolved) return json({ data: null, error: { message: 'Route not found', code: 'not_found' } }, { status: 404 });

    const dispatch = async (index: number): Promise<Response> => {
      const mw = this.middleware[index];
      if (!mw) return resolved.route.handler(c);
      return mw(c, () => dispatch(index + 1));
    };

    try {
      return await dispatch(0);
    } catch (error) {
      if (error instanceof HttpError) return fail(error);
      console.error('[worker:error]', error instanceof Error ? error.stack || error.message : error);
      return fail(error);
    }
  }

}

function matchRoute<E>(route: Route<E>, segments: string[]): Record<string, string> | null {
  if (route.segments.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < route.segments.length; i++) {
    const pattern = route.segments[i];
    const actual = segments[i];
    if (pattern.startsWith(':')) {
      params[pattern.slice(1)] = decodeURIComponent(actual);
    } else if (pattern.startsWith('*')) {
      return params;
    } else if (pattern !== actual) {
      return null;
    }
  }
  return params;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
