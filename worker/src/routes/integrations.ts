/**
 * GitHub integration: repository discovery, one-click portfolio import, sync.
 * Responses are cached in KV when available so we stay well inside GitHub's
 * unauthenticated rate limits.
 */
import { z } from 'zod';
import type { Env } from '../env';
import type { Router } from '../lib/router';
import { HttpError, ok, slugify } from '../lib/http';
import { db, primeContext, requireUser } from '../lib/context';
import { uuid } from '../lib/crypto';
import { LIMITS, rateLimit } from '../lib/ratelimit';
import { pushActivity } from '../lib/tables';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C#': '#178600',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  updated_at: string;
  pushed_at: string;
  visibility: string;
  fork: boolean;
  archived: boolean;
}

const usernameSchema = z.string().trim().regex(/^[a-zA-Z0-9-]{1,40}$/, 'Enter a valid GitHub username');

async function githubFetch(env: Env, path: string, headers: Record<string, string> = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portify-portfolio-worker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      ...headers,
    },
  });
  if (response.status === 404) throw HttpError.notFound('GitHub user not found');
  if (response.status === 403 || response.status === 429) {
    throw HttpError.tooMany('GitHub rate limit reached — add a GITHUB_TOKEN secret or try again later.');
  }
  if (!response.ok) throw new HttpError(502, `GitHub request failed (${response.status})`, 'upstream_error');
  return response;
}

export function registerIntegrationRoutes(router: Router<Env>) {
  router.get('/api/integrations/github/repos', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const username = usernameSchema.parse(c.query.get('username') || '');
    await rateLimit(c.env, { ...LIMITS.githubImport, identity: user.id });

    const cacheKey = `gh:repos:${username.toLowerCase()}`;
    if (c.env.CACHE) {
      const cached = await c.env.CACHE.get(cacheKey, 'json');
      if (cached) return ok({ ...(cached as object), cached: true });
    }

    const response = await githubFetch(
      c.env,
      `/users/${username}/repos?per_page=100&sort=updated&type=owner`
    );
    const repos = (await response.json()) as GitHubRepo[];
    const mapped = repos
      .filter((repo) => !repo.fork)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        language_color: repo.language ? LANG_COLORS[repo.language] ?? '#8b8baf' : null,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: repo.topics ?? [],
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        visibility: repo.visibility,
        archived: repo.archived,
      }));

    const payload = { username, repositories: mapped, count: mapped.length };
    if (c.env.CACHE) {
      c.exec.waitUntil(c.env.CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 900 }));
    }
    return ok(payload);
  });

  router.post('/api/integrations/github/import', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const body = z
      .object({
        username: z.string().trim().max(60).optional(),
        repositories: z
          .array(
            z.object({
              id: z.union([z.number(), z.string()]).optional(),
              name: z.string().min(1),
              description: z.string().nullable().optional(),
              html_url: z.string(),
              homepage: z.string().nullable().optional(),
              language: z.string().nullable().optional(),
              topics: z.array(z.string()).optional(),
              stargazers_count: z.number().optional(),
              stars: z.number().optional(),
              forks_count: z.number().optional(),
              forks: z.number().optional(),
              updated_at: z.string().optional(),
            })
          )
          .min(1, 'Select at least one repository'),
        featured: z.boolean().optional(),
      })
      .parse(await c.body());

    const now = new Date().toISOString();
    const created: unknown[] = [];

    for (const repo of body.repositories) {
      const existing = await c.env.DB.prepare(`SELECT id FROM projects WHERE user_id = ? AND repo_url = ?`)
        .bind(user.id, repo.html_url)
        .first<{ id: string }>();
      if (existing) continue;

      const tags = [...(repo.topics ?? [])];
      if (repo.language) tags.unshift(repo.language);

      const id = uuid();
      await c.env.DB.prepare(
        `INSERT INTO projects (id, user_id, title, slug, description, long_description, tags, image_url, repo_url, demo_url,
                               category, status, featured, stars, forks, contributors, source, github_id, is_public, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open-source', 'shipped', ?, ?, ?, 1, 'github', ?, 1, ?, ?)`
      )
        .bind(
          id,
          user.id,
          repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
          slugify(repo.name),
          repo.description ?? 'Imported from GitHub',
          repo.description ?? '',
          JSON.stringify([...new Set(tags)].slice(0, 8)),
          `https://opengraph.githubassets.com/1/${repo.html_url.replace('https://github.com/', '')}`,
          repo.html_url,
          repo.homepage ?? null,
          body.featured ? 1 : 0,
          repo.stars ?? repo.stargazers_count ?? 0,
          repo.forks ?? repo.forks_count ?? 0,
          String(repo.id ?? ''),
          now,
          now
        )
        .run();

      await pushActivity({ env: c.env, user, isAdmin: false }, user.id, user.id, 'project_create', 'project', id, {
        title: repo.name,
      });
      created.push({ id, title: repo.name, repo_url: repo.html_url });
    }

    return ok({
      imported: created.length,
      skipped: body.repositories.length - created.length,
      projects: created,
      message: created.length
        ? `Imported ${created.length} repositor${created.length === 1 ? 'y' : 'ies'} into your portfolio.`
        : 'Those repositories were already in your portfolio.',
    });
  });

  router.post('/api/integrations/github/sync', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    await rateLimit(c.env, { ...LIMITS.githubImport, identity: user.id });

    const rows = await c.env.DB.prepare(
      `SELECT id, repo_url FROM projects WHERE user_id = ? AND source = 'github' AND repo_url LIKE 'https://github.com/%' LIMIT 25`
    )
      .bind(user.id)
      .all<{ id: string; repo_url: string }>();

    let updated = 0;
    for (const row of rows.results ?? []) {
      try {
        const path = `/repos/${row.repo_url.replace('https://github.com/', '')}`;
        const response = await githubFetch(c.env, path);
        const repo = (await response.json()) as GitHubRepo;
        await c.env.DB.prepare(
          `UPDATE projects SET stars = ?, forks = ?, description = COALESCE(NULLIF(description, ''), ?), updated_at = ? WHERE id = ?`
        )
          .bind(repo.stargazers_count, repo.forks_count, repo.description ?? '', new Date().toISOString(), row.id)
          .run();
        updated += 1;
      } catch (error) {
        console.warn('[github] sync failed for', row.repo_url, error);
      }
    }

    return ok({ updated, checked: (rows.results ?? []).length });
  });

  /** Language breakdown used by the portfolio dashboard. */
  router.get('/api/integrations/github/languages/:username', async (c) => {
    await primeContext(c);
    requireUser(c);
    const username = usernameSchema.parse(c.params.username);
    const response = await githubFetch(c.env, `/users/${username}/repos?per_page=100&sort=updated&type=owner`);
    const repos = (await response.json()) as GitHubRepo[];
    const counts = new Map<string, number>();
    for (const repo of repos) {
      if (!repo.language) continue;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return ok({
      languages: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / total) * 100),
          color: LANG_COLORS[name] ?? '#8b8baf',
        })),
    });
  });
}
