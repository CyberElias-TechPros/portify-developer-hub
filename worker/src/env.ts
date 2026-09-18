/**
 * Cloudflare Worker bindings & environment for the Portify API.
 */
export interface Env {
  /** D1 database (SQLite) — primary datastore. */
  DB: D1Database;
  /** Optional R2 bucket for user media (avatars, covers, resumes). */
  MEDIA?: R2Bucket;
  /** Optional KV namespace for short-lived caches / rate limits. */
  CACHE?: KVNamespace;
  /** Static asset binding (Workers Assets). */
  ASSETS?: { fetch: (req: Request) => Promise<Response> };

  // ---- configuration (wrangler [vars] / .dev.vars / secrets) -------------
  APP_NAME?: string;
  APP_URL?: string;
  ENVIRONMENT?: string;
  PUBLIC_SIGNUPS?: string;
  AUTO_SEED?: string;
  REQUIRE_EMAIL_VERIFICATION?: string;
  DEV_RETURN_TOKENS?: string;
  ALLOW_DEV_ROUTES?: string;
  RATE_LIMIT_DISABLED?: string;

  // ---- secrets -----------------------------------------------------------
  SESSION_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_TOKEN?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  CONTACT_INBOX?: string;
}

export type Role = 'admin' | 'moderator' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
  sessionId: string;
  metadata: Record<string, unknown>;
}

export const DEFAULT_SETTINGS = {
  contact_info: {
    email: 'hello@portify.dev',
    phone: '',
    address: 'Remote — Worldwide',
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
  },
  social_links: {
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    instagram: '',
    youtube: '',
    facebook: '',
  },
  site_info: {
    title: 'Portify — Developer Portfolio Hub',
    description:
      'Craft an award-winning developer portfolio: projects, case studies, writing, and a live resume — in minutes.',
    keywords: 'developer portfolio, portfolio builder, resume, projects, blog, cloudflare',
    author: 'Portify',
    logo_url: '',
    favicon_url: '',
    twitter_handle: '@portify',
  },
  theme: {
    layout: 'multi-page',
    colorScheme: 'cinematic',
    accent: '#7c5cff',
    typography: 'sora',
    darkMode: true,
    radius: 1.25,
  },
  features: {
    blog: true,
    community: true,
    contact: true,
    resume: true,
    analytics: true,
    discovery: true,
  },
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
