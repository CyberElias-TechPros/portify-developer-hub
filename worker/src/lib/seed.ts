/**
 * Demo seed data — gives a brand-new deployment a fully populated, believable
 * platform (portfolios, projects, writing, community activity, analytics).
 * Idempotent: safe to run repeatedly.
 */
import type { Env } from '../env';
import { hashPassword, uuid } from './crypto';
import { ensureProfileExists } from './auth';

export const DEMO_ACCOUNT = {
  email: 'elias@portify.dev',
  password: 'demo1234',
  username: 'elias',
};

interface SeedPerson {
  email: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  location: string;
  accent: string;
  github: string;
  avatar: string;
}

const PEOPLE: SeedPerson[] = [
  {
    email: DEMO_ACCOUNT.email,
    name: 'Elias Okonkwo',
    username: DEMO_ACCOUNT.username,
    title: 'Product Engineer · Design Systems · Cloudflare',
    bio: 'I build interfaces that feel inevitable. Twelve years shipping products for teams who care about craft — currently deep in edge computing, motion design and developer experience.',
    location: 'Lagos, Nigeria · Remote',
    accent: '#7c5cff',
    github: 'https://github.com',
    avatar: 'https://avatars.githubusercontent.com/u/9919?s=400&v=4',
  },
  {
    email: 'mara@portify.dev',
    name: 'Mara Lindqvist',
    username: 'mara',
    title: 'Staff Frontend Engineer',
    bio: 'Design systems, accessibility, and performance budgets. I make big applications feel small and fast.',
    location: 'Stockholm, Sweden',
    accent: '#22d3ee',
    github: 'https://github.com',
    avatar: 'https://avatars.githubusercontent.com/u/499550?s=400&v=4',
  },
  {
    email: 'tobi@portify.dev',
    name: 'Tobi Adeyemi',
    username: 'tobi',
    title: 'Platform & Infrastructure Lead',
    bio: 'Kubernetes wrangler. I turn fragile deploy pipelines into boring, predictable ones.',
    location: 'Berlin, Germany',
    accent: '#f59e0b',
    github: 'https://github.com',
    avatar: 'https://avatars.githubusercontent.com/u/1500684?s=400&v=4',
  },
  {
    email: 'amara@portify.dev',
    name: 'Amara Chen',
    username: 'amara',
    title: 'Product Designer & Creative Technologist',
    bio: 'I design the seams between product and brand: motion systems, type, and the details nobody notices until they are missing.',
    location: 'Singapore',
    accent: '#f472b6',
    github: 'https://github.com',
    avatar: 'https://avatars.githubusercontent.com/u/810438?s=400&v=4',
  },
  {
    email: 'noah@portify.dev',
    name: 'Noah Bennett',
    username: 'noah',
    title: 'Full-stack Developer · Rust & TypeScript',
    bio: 'Systems thinking with a product mindset. Currently building developer tooling that stays out of the way.',
    location: 'Austin, USA',
    accent: '#34d399',
    github: 'https://github.com',
    avatar: 'https://avatars.githubusercontent.com/u/69631?s=400&v=4',
  },
  {
    email: 'priya@portify.dev',
    name: 'Priya Raman',
    username: 'priya',
    title: 'Machine Learning Engineer',
    bio: 'Turning messy data into decisions. Retrieval systems, evaluation harnesses and the odd research paper.',
    location: 'Bengaluru, India',
    accent: '#a78bfa',
    github: 'https://github.com',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?s=400&v=4',
  },
];

const SKILLS: Array<[string, string, number, number, string]> = [
  ['TypeScript', 'languages', 96, 2016, 'typescript'],
  ['JavaScript', 'languages', 95, 2011, 'javascript'],
  ['React', 'frameworks', 95, 2015, 'react'],
  ['Next.js', 'frameworks', 90, 2018, 'nextjs'],
  ['Node.js', 'frameworks', 88, 2014, 'nodejs'],
  ['Cloudflare Workers', 'platforms', 92, 2021, 'cloudflareworkers'],
  ['D1 / SQLite', 'databases', 87, 2021, 'sqlite'],
  ['PostgreSQL', 'databases', 84, 2016, 'postgresql'],
  ['Rust', 'languages', 74, 2020, 'rust'],
  ['Go', 'languages', 78, 2019, 'go'],
  ['Figma', 'design', 88, 2016, 'figma'],
  ['Tailwind CSS', 'design', 94, 2019, 'tailwindcss'],
  ['Framer Motion', 'design', 90, 2020, 'framer'],
  ['Docker', 'devops', 82, 2017, 'docker'],
  ['GitHub Actions', 'devops', 89, 2019, 'githubactions'],
];

const PROJECTS: Array<{
  title: string;
  blurb: string;
  long: string;
  tags: string[];
  featured: number;
  stars: number;
  category: string;
  demo: string;
  repo: string;
}> = [
  {
    title: 'Portify Developer Hub',
    blurb: 'A cinematic portfolio platform running entirely on Cloudflare Workers, D1 and R2.',
    long: 'Portify pairs a hand-built design system with an edge-native API. Sessions, portfolios, analytics and media all run within 50ms of the visitor — no origin server, no cold starts, no ceremony. The editor writes straight to D1 with row-level policies enforced per request.',
    tags: ['TypeScript', 'Cloudflare Workers', 'D1', 'React', 'R3F'],
    featured: 1,
    stars: 1284,
    category: 'platform',
    demo: 'https://portify.dev',
    repo: 'https://github.com',
  },
  {
    title: 'Kinetic — Motion System',
    blurb: 'A choreography library for product teams: scroll, gesture and state in one declarative API.',
    long: 'Kinetic turns motion into a design token. Teams describe intent ("enter from the left, on scroll, 120ms after the headline") and the library produces accessible, reduced-motion aware choreography for React and vanilla DOM.',
    tags: ['React', 'Framer Motion', 'Design Systems'],
    featured: 1,
    stars: 842,
    category: 'library',
    demo: '',
    repo: 'https://github.com',
  },
  {
    title: 'Halo Analytics',
    blurb: 'Privacy-first, cookieless analytics with sub-second edge ingestion.',
    long: 'Halo captures page views, funnels and referrers without a single third-party cookie. Events land in D1 within milliseconds, and dashboards are pre-aggregated at the edge so queries stay under 20ms.',
    tags: ['Cloudflare Workers', 'D1', 'Analytics'],
    featured: 0,
    stars: 517,
    category: 'product',
    demo: '',
    repo: 'https://github.com',
  },
  {
    title: 'Atlas Design Tokens',
    blurb: 'Multi-brand theming pipeline: one source of truth, eleven outputs, zero drift.',
    long: 'Atlas compiles a single token file into CSS custom properties, Tailwind presets, Figma variables and native platform themes — with semantic diffs that designers and engineers can both read.',
    tags: ['Design Systems', 'Tailwind CSS', 'Node.js'],
    featured: 0,
    stars: 366,
    category: 'tooling',
    demo: '',
    repo: 'https://github.com',
  },
  {
    title: 'Signal Edge Router',
    blurb: 'An opinionated routing layer for Workers with typed params and streaming responses.',
    long: 'Signal adds typed routes, middleware composition and structured error envelopes on top of the Workers runtime, while adding less than 4KB to the bundle.',
    tags: ['TypeScript', 'Cloudflare Workers', 'Open Source'],
    featured: 0,
    stars: 289,
    category: 'library',
    demo: '',
    repo: 'https://github.com',
  },
  {
    title: 'Northwind Case Study',
    blurb: 'Replatforming a 12-year-old retail dashboard into an edge-rendered product.',
    long: 'Migrated 320 screens, cut time-to-interactive from 6.4s to 0.9s and rebuilt the design language around a motion-first system. Conversion on the checkout funnel rose 23%.',
    tags: ['Product', 'Performance', 'Case Study'],
    featured: 0,
    stars: 0,
    category: 'case-study',
    demo: '',
    repo: '',
  },
];

const EXPERIENCES = [
  {
    company: 'Edgecraft',
    position: 'Principal Product Engineer',
    employment: 'full-time',
    location: 'Remote',
    start: '2022-03-01',
    end: null as string | null,
    description:
      'Lead the platform team building an edge-native commerce stack on Cloudflare. Cut p95 latency 68%, shipped the design system used by 40 engineers, and mentor three staff-level engineers.',
    technologies: ['Cloudflare Workers', 'D1', 'TypeScript', 'React'],
  },
  {
    company: 'Lumen Studio',
    position: 'Senior Frontend Engineer',
    employment: 'full-time',
    location: 'London, UK',
    start: '2019-06-01',
    end: '2022-02-01',
    description:
      'Built award-winning marketing experiences for six FTSE-100 clients. Introduced a motion system that became the studio default and reduced build time 45%.',
    technologies: ['React', 'Framer Motion', 'WebGL'],
  },
  {
    company: 'Freelance',
    position: 'Independent Developer & Designer',
    employment: 'freelance',
    location: 'Global',
    start: '2016-01-01',
    end: '2019-05-01',
    description:
      'Partnered with 30+ founders on product strategy, design and delivery — from first wireframe to production deploy.',
    technologies: ['Design Systems', 'Node.js', 'Postgres'],
  },
];

const EDUCATION = [
  {
    institution: 'University of Lagos',
    degree: 'BSc',
    field: 'Computer Science',
    location: 'Lagos, Nigeria',
    start: '2011-09-01',
    end: '2015-07-01',
    description: 'First class honours. Final year research on real-time collaborative interfaces.',
  },
];

const POSTS = [
  {
    title: 'Designing Motion That Respects Your Users',
    slug: 'designing-motion-that-respects-your-users',
    excerpt:
      'Motion is a language. Used well it explains hierarchy; used badly it taxes attention. Here is the system I use to keep animation honest.',
    category: 'design',
    tags: ['Motion', 'Accessibility', 'Design Systems'],
    reading: 8,
    content: `## Motion is a promise

Every animation tells the user something: *this came from there*, *that control is now primary*, *your action landed*. When motion stops carrying meaning it becomes decoration — and decoration at 60fps is expensive.

### Three rules

1. **One idea per transition.** If a move communicates two things, split it.
2. **Distance equals hierarchy.** A full-screen transition deserves 400ms; a hover state deserves 120ms.
3. **Honour the system.** \`prefers-reduced-motion\` is not an edge case, it is a contract.

\`\`\`ts
const transition = reducedMotion
  ? { duration: 0 }
  : { type: 'spring', stiffness: 220, damping: 26 };
\`\`\`

### Measuring the invisible

Watch recordings of real sessions. If a user waits for an animation before they can act, the animation is too long, regardless of how good it looks.`,
  },
  {
    title: 'Shipping a Full Stack on Cloudflare Workers',
    slug: 'shipping-a-full-stack-on-cloudflare-workers',
    excerpt:
      'No origin server, no cold starts, no region selection. A practical tour of Workers, D1, R2 and KV for product teams.',
    category: 'engineering',
    tags: ['Cloudflare', 'Edge', 'Architecture'],
    reading: 11,
    content: `## Why move the backend to the edge?

Latency is a feature. When your API runs in the same runtime as the CDN, every request is a local call.

### The stack

| Concern | Primitive | Why |
| --- | --- | --- |
| Compute | Workers | 0ms cold start, 200+ locations |
| Data | D1 | SQLite, read replicas at the edge |
| Objects | R2 | Zero egress fees |
| Cache | KV | Config + rate limits |

### Policies at the edge

Row-level security does not need a database server: define it as a filter your query layer must apply.

\`\`\`ts
const scope = policy.read(ctx);      // ("is_public = 1 OR user_id = ?")
const rows  = await db.prepare(sql).bind(...scope.params).all();
\`\`\`

Deployments are one command — and every environment is reproducible.`,
  },
  {
    title: 'The Portfolio Is a Product',
    slug: 'the-portfolio-is-a-product',
    excerpt:
      'Most developer portfolios are CVs with gradients. Treat yours like a product and it starts doing sales work for you.',
    category: 'career',
    tags: ['Career', 'Storytelling', 'Product'],
    reading: 6,
    content: `## Your portfolio has a job

Decide what it is for: landing interviews, closing freelance work, or building an audience. Every section either serves that job or gets cut.

### What actually converts

- **Outcomes over screenshots.** "Cut checkout time 23%" beats "React, Node, AWS".
- **One project, deeply told.** Depth reads as competence; breadth reads as a list.
- **Writing.** A single clear essay demonstrates thinking better than ten cards.
- **A way to act.** One obvious next step — a form, a calendar, an email.

### Ship the third version

The first version is for you. The second is for recruiters. The third is for the person with a budget. Most people never get past version one.`,
  },
];

const TESTIMONIALS = [
  {
    author: 'mara',
    text: 'Elias raises the ceiling of every team he joins. The design system he built is still the backbone of our product two years later.',
    title: 'Staff Frontend Engineer at Northwind',
    company: 'Northwind',
  },
  {
    author: 'tobi',
    text: 'Rare combination: he can design the interface, architect the backend, and explain the trade-offs to the board without losing anyone.',
    title: 'Platform Lead at Edgecraft',
    company: 'Edgecraft',
  },
  {
    author: 'amara',
    text: 'The most detail-obsessed engineer I have worked with — in the best way. Our launch felt expensive because of the care he put in.',
    title: 'Creative Technologist',
    company: 'Lumen Studio',
  },
];

export async function runSeed(env: Env, options: { demo?: boolean } = {}) {
  const results: Record<string, number> = {};
  const now = new Date().toISOString();

  // Site settings baseline.
  for (const [key, value] of Object.entries({
    site_info: {
      title: 'Portify — Developer Portfolio Hub',
      description: 'Cinematic portfolios, live resumes and case studies — built on the edge with Cloudflare.',
      keywords: 'developer portfolio, cloudflare, resume, projects, blog',
      author: 'Portify',
      twitter_handle: '@portify',
    },
    contact_info: {
      email: 'hello@portify.dev',
      phone: '+1 (555) 019-2200',
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
    theme: {
      layout: 'immersive',
      colorScheme: 'cinematic',
      accent: '#7c5cff',
      typography: 'sora',
      darkMode: true,
      radius: 1.25,
    },
    features: { blog: true, community: true, contact: true, resume: true, analytics: true, discovery: true },
  })) {
    await env.DB.prepare(
      `INSERT INTO site_settings (id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO NOTHING`
    )
      .bind(uuid(), key, JSON.stringify(value), now, now)
      .run();
  }
  results.settings = 5;

  const existingUsers = await env.DB.prepare(`SELECT COUNT(*) AS c FROM users`).first<{ c: number }>();
  if ((existingUsers?.c ?? 0) > 0) {
    return { skipped: true, reason: 'Database already contains users', ...results };
  }

  const ids = new Map<string, string>();

  // ------------------------------------------------------------- accounts --
  for (const [index, person] of PEOPLE.entries()) {
    const isDemo = person.email === DEMO_ACCOUNT.email;
    const password = await hashPassword(isDemo ? DEMO_ACCOUNT.password : 'portfolio123');
    const userId = uuid();
    ids.set(person.username, userId);
    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, password_iter, provider, email_verified, is_active, metadata, last_sign_in_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'password', 1, 1, ?, ?, ?, ?)`
    )
      .bind(
        userId,
        person.email,
        password.hash,
        password.salt,
        password.iterations,
        JSON.stringify({ seeded: true }),
        new Date(Date.now() - (index + 2) * 864e5).toISOString(),
        new Date(Date.now() - (index + 12) * 864e5).toISOString(),
        now
      )
      .run();

    await ensureProfileExists(env, userId, person.email, {
      full_name: person.name,
      avatar_url: person.avatar,
      title: person.title,
      bio: person.bio,
      location: person.location,
    });

    await env.DB.prepare(
      `UPDATE profiles SET username = ?, display_name = ?, full_name = ?, title = ?, bio = ?, long_bio = ?,
              location = ?, accent = ?, github = COALESCE(github, ?), avatar_url = ?, cover_url = NULL,
              availability = ?, is_verified = ?, onboarding_step = 4, profile_views = ?, updated_at = ?
        WHERE id = ?`
    )
      .bind(
        person.username,
        person.name,
        person.name,
        person.title,
        person.bio,
        `${person.bio}\n\nI care about the details that make software feel considered: typography, motion, latency and the empty states nobody plans for.`,
        person.location,
        person.accent,
        person.github,
        person.avatar,
        index % 3 === 0 ? 'open' : index % 3 === 1 ? 'hiring' : 'busy',
        index % 4 === 0 ? 1 : 0,
        Math.floor(Math.random() * 900) + 120,
        now,
        userId
      )
      .run();

    await env.DB.prepare(
      `INSERT OR REPLACE INTO usernames (id, user_id, username, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(uuid(), userId, person.username, now, now)
      .run();

    const role = isDemo ? 'admin' : index === 1 ? 'moderator' : 'user';
    await env.DB.prepare(`DELETE FROM user_roles WHERE user_id = ?`).bind(userId).run();
    await env.DB.prepare(`INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, ?)`)
      .bind(uuid(), userId, role, now)
      .run();
  }
  results.users = PEOPLE.length;

  // ------------------------------------------------- portfolio for demoer --
  const owner = ids.get(DEMO_ACCOUNT.username)!;

  for (const [index, skill] of SKILLS.entries()) {
    await env.DB.prepare(
      `INSERT INTO skills (id, user_id, name, category, proficiency, icon_url, year_acquired, endorsed, description, is_public, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
    )
      .bind(
        uuid(),
        owner,
        skill[0],
        skill[1],
        skill[2],
        skill[3],
        `https://cdn.simpleicons.org/${skill[4]}`,
        Math.floor(skill[2] / 6),
        null,
        index,
        now,
        now
      )
      .run();
  }
  results.skills = SKILLS.length;

  for (const project of PROJECTS) {
    const id = uuid();
    await env.DB.prepare(
      `INSERT INTO projects (id, user_id, title, description, long_description, tags, image_url, repo_url, demo_url, category,
                             status, featured, stars, forks, contributors, source, is_public, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'shipped', ?, ?, 0, 1, 'manual', 1, 0, ?, ?)`
    )
      .bind(
        id,
        owner,
        project.title,
        project.blurb,
        project.long,
        JSON.stringify(project.tags),
        `https://images.unsplash.com/photo-${
          ['1555066931-4365d14bab8c', '1618761714954-0b8cd0026356', '1517180102446-f3ece451e9d8', '1522542550221-31fd19575a2d', '1454165804606-c3d57bc86b40', '1498050108023-c5249f4df085'][
            PROJECTS.indexOf(project) % 6
          ]
        }?auto=format&fit=crop&w=1200&q=70`,
        project.repo || null,
        project.demo || null,
        project.category,
        project.featured,
        project.stars,
        new Date(Date.now() - PROJECTS.indexOf(project) * 9 * 864e5).toISOString(),
        now
      )
      .run();
  }
  results.projects = PROJECTS.length;

  for (const [index, exp] of EXPERIENCES.entries()) {
    await env.DB.prepare(
      `INSERT INTO experiences (id, user_id, company, position, employment, location, start_date, end_date, description, company_url,
                                technologies, projects, is_public, position_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 1, ?, ?, ?)`
    )
      .bind(
        uuid(),
        owner,
        exp.company,
        exp.position,
        exp.employment,
        exp.location,
        exp.start,
        exp.end,
        exp.description,
        `https://${exp.company.toLowerCase().replace(/\s+/g, '')}.example.com`,
        JSON.stringify(exp.technologies),
        index,
        now,
        now
      )
      .run();
  }
  results.experiences = EXPERIENCES.length;

  for (const edu of EDUCATION) {
    await env.DB.prepare(
      `INSERT INTO education (id, user_id, institution, degree, field, location, start_date, end_date, description, is_public, position_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
    )
      .bind(uuid(), owner, edu.institution, edu.degree, edu.field, edu.location, edu.start, edu.end, edu.description, now, now)
      .run();
  }
  results.education = EDUCATION.length;

  for (const post of POSTS) {
    await env.DB.prepare(
      `INSERT INTO blog_posts (id, user_id, title, slug, excerpt, content, cover_image_url, category, tags, reading_time,
                               views, likes, published, is_public, featured, publish_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, 1, 1, ?, ?, ?, ?)`
    )
      .bind(
        uuid(),
        owner,
        post.title,
        post.slug,
        post.excerpt,
        post.content,
        post.category,
        JSON.stringify(post.tags),
        post.reading,
        Math.floor(Math.random() * 1800) + 200,
        POSTS.indexOf(post) === 0 ? 1 : 0,
        new Date(Date.now() - POSTS.indexOf(post) * 12 * 864e5).toISOString(),
        new Date(Date.now() - POSTS.indexOf(post) * 12 * 864e5).toISOString(),
        now
      )
      .run();
  }
  results.posts = POSTS.length;

  // -------------------------------------------------------- other people --
  const others = PEOPLE.filter((p) => p.username !== DEMO_ACCOUNT.username);
  for (const [index, person] of others.entries()) {
    const personId = ids.get(person.username)!;

    const skillSample = SKILLS.slice(index, index + 6).length ? SKILLS.slice(index, index + 6) : SKILLS.slice(0, 6);
    for (const [sIndex, skill] of skillSample.entries()) {
      await env.DB.prepare(
        `INSERT INTO skills (id, user_id, name, category, proficiency, icon_url, year_acquired, endorsed, is_public, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      )
        .bind(
          uuid(),
          personId,
          skill[0],
          skill[1],
          Math.max(55, skill[2] - index * 4),
          skill[3],
          `https://cdn.simpleicons.org/${skill[4]}`,
          Math.floor(skill[2] / 10),
          sIndex,
          now,
          now
        )
        .run();
    }

    for (const [pIndex, project] of PROJECTS.slice(index % 3, (index % 3) + 2).entries()) {
      await env.DB.prepare(
        `INSERT INTO projects (id, user_id, title, description, long_description, tags, image_url, repo_url, category, status,
                               featured, stars, forks, contributors, source, is_public, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'shipped', ?, ?, 0, 1, 'manual', 1, ?, ?, ?)`
      )
        .bind(
          uuid(),
          personId,
          `${project.title}${index % 2 ? '' : ' — v2'}`,
          project.blurb,
          project.long,
          JSON.stringify(project.tags.slice(0, 3)),
          `https://images.unsplash.com/photo-${
            ['1551650975-87deedd944c3', '1461749280684-dccba630e2f6', '1517694712202-14dd9538aa97', '1504639725590-34d0984388bd', '1550439062-609e1531270e'][(index + pIndex) % 5]
          }?auto=format&fit=crop&w=1200&q=70`,
          project.repo || null,
          project.category,
          pIndex === 0 && index % 2 === 0 ? 1 : 0,
          Math.floor(Math.random() * 400),
          pIndex,
          new Date(Date.now() - (index + pIndex) * 6 * 864e5).toISOString(),
          now
        )
        .run();
    }

    await env.DB.prepare(
      `INSERT INTO experiences (id, user_id, company, position, employment, location, start_date, end_date, description, technologies, projects, is_public, position_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'full-time', ?, ?, NULL, ?, ?, '[]', 1, 0, ?, ?)`
    )
      .bind(
        uuid(),
        personId,
        ['Northwind Labs', 'Vertex Systems', 'Orbit Studio', 'Foundry AI', 'Kite & Co'][index % 5],
        person.title,
        person.location,
        `${2019 + index}-02-01`,
        `${person.name.split(' ')[0]} works across product, platform and design — shipping features end-to-end and raising the quality bar for everyone around them.`,
        JSON.stringify(SKILLS.slice(index, index + 3).map((s) => s[0])),
        now,
        now
      )
      .run();

    await env.DB.prepare(
      `INSERT OR REPLACE INTO themes (id, user_id, name, config, is_active, created_at, updated_at) VALUES (?, ?, 'Cinematic', ?, 1, ?, ?)`
    )
      .bind(
        uuid(),
        personId,
        JSON.stringify({ accent: person.accent, secondary: '#22d3ee', typography: 'sora', layout: 'immersive', darkMode: true, radius: 1.25 }),
        now,
        now
      )
      .run();
  }

  // ---------------------------------------------------------- community --
  const allIds = [...ids.values()];
  for (const follower of allIds) {
    for (const target of allIds) {
      if (follower === target) continue;
      if (Math.random() > 0.55) continue;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO user_follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, ?)`
      )
        .bind(uuid(), follower, target, new Date(Date.now() - Math.random() * 20 * 864e5).toISOString())
        .run();
    }
  }
  results.follows = await count(env, 'user_follows');

  const demoProjects = await env.DB.prepare(`SELECT id, title FROM projects WHERE user_id = ?`).bind(owner).all<any>();
  const demoTitles = new Map((demoProjects.results ?? []).map((p: any) => [p.id, p.title]));

  for (const [index, person] of others.entries()) {
    const personId = ids.get(person.username)!;
    const reactions: Array<[string, string]> = [
      ['love', 'Insightful, generous work.'],
      ['celebrate', 'This is the level of craft I want in my own portfolio.'],
      ['insightful', 'The motion system especially — so considered.'],
    ];
    for (const projectId of [...demoTitles.keys()].slice(index, index + 3)) {
      const [type, text] = reactions[index % reactions.length];
      await env.DB.prepare(
        `INSERT OR IGNORE INTO reactions (id, user_id, content_type, content_id, reaction_type, created_at) VALUES (?, ?, 'project', ?, ?, ?)`
      )
        .bind(uuid(), personId, projectId, type, new Date(Date.now() - index * 864e5).toISOString())
        .run();

      await env.DB.prepare(
        `INSERT INTO comments (id, user_id, content_type, content_id, content, created_at, updated_at) VALUES (?, ?, 'project', ?, ?, ?, ?)`
      )
        .bind(uuid(), personId, projectId, `${text} (on ${demoTitles.get(projectId)})`, new Date(Date.now() - index * 864e5).toISOString(), now)
        .run();
    }
  }
  results.comments = await count(env, 'comments');
  results.reactions = await count(env, 'reactions');

  for (const [index, testimonial] of TESTIMONIALS.entries()) {
    const authorId = ids.get(testimonial.author)!;
    await env.DB.prepare(
      `INSERT INTO testimonials (id, user_id, author_id, author_name, author_title, company, text, rating, approved, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 5, 1, ?)`
    )
      .bind(
        uuid(),
        owner,
        authorId,
        PEOPLE.find((p) => p.username === testimonial.author)?.name ?? '',
        testimonial.title,
        testimonial.company,
        testimonial.text,
        new Date(Date.now() - index * 6 * 864e5).toISOString()
      )
      .run();
  }
  results.testimonials = TESTIMONIALS.length;

  for (const [index, message] of [
    {
      name: 'Dana Whitfield',
      email: 'dana@northwind.example',
      subject: 'Contract: design system audit',
      message: 'We loved the way your portfolio is structured. Could we book you for a two-week design system audit in March?',
      starred: 1,
      read: 0,
    },
    {
      name: 'Kwame Mensah',
      email: 'kwame@foundry.example',
      subject: 'Speaking invitation',
      message: 'Would you speak at our edge computing meetup about running full products on Workers?',
      starred: 0,
      read: 0,
    },
    {
      name: 'Sofia Rossi',
      email: 'sofia@atlas.example',
      subject: 'Full-time role — Principal Engineer',
      message: 'We are hiring a principal engineer for our platform group and your work on edge latency is exactly the profile we need.',
      starred: 0,
      read: 1,
    },
  ].entries()) {
    await env.DB.prepare(
      `INSERT INTO contact_messages (id, name, email, subject, message, recipient_id, read, starred, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uuid(),
        message.name,
        message.email,
        message.subject,
        message.message,
        owner,
        message.read,
        message.starred,
        new Date(Date.now() - index * 2 * 864e5).toISOString()
      )
      .run();
  }
  results.messages = 3;

  // --------------------------------------------------------- analytics --
  const paths = ['/', '/projects', '/blog', '/skills', '/experience', '/contact'];
  const referrers = ['https://www.google.com/', 'https://twitter.com/', 'https://github.com/', '', 'https://news.ycombinator.com/'];
  const countries = ['US', 'GB', 'DE', 'NG', 'IN', 'SG', 'BR', 'CA'];
  let statementBatch: D1PreparedStatement[] = [];
  for (let day = 29; day >= 0; day--) {
    const views = 14 + Math.floor(Math.random() * 28) + (29 - day);
    for (let i = 0; i < views; i++) {
      statementBatch.push(
        env.DB.prepare(
          `INSERT INTO analytics_events (id, owner_id, session_key, event_type, path, referrer, country, device, browser, os, created_at)
           VALUES (?, ?, ?, 'page_view', ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          uuid(),
          owner,
          `seed-${day}-${i}`,
          '/' + DEMO_ACCOUNT.username + paths[Math.floor(Math.random() * paths.length)],
          referrers[Math.floor(Math.random() * referrers.length)],
          countries[Math.floor(Math.random() * countries.length)],
          Math.random() > 0.35 ? 'desktop' : 'mobile',
          ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)],
          ['macOS', 'Windows', 'iOS', 'Android'][Math.floor(Math.random() * 4)],
          new Date(Date.now() - day * 864e5 - Math.floor(Math.random() * 864e5)).toISOString()
        )
      );
      if (statementBatch.length >= 60) {
        await env.DB.batch(statementBatch);
        statementBatch = [];
      }
    }
  }
  if (statementBatch.length) await env.DB.batch(statementBatch);
  results.analytics = await count(env, 'analytics_events');

  // Activity feed entries.
  for (const [index, person] of others.entries()) {
    const personId = ids.get(person.username)!;
    await env.DB.prepare(
      `INSERT INTO activity_feed (id, user_id, actor_id, activity_type, content_type, content_id, metadata, created_at)
       VALUES (?, ?, ?, 'follow', 'profile', ?, '{}', ?)`
    )
      .bind(uuid(), owner, personId, personId, new Date(Date.now() - index * 864e5).toISOString())
      .run();
  }
  for (const [index, projectId] of [...demoTitles.keys()].slice(0, 3).entries()) {
    await env.DB.prepare(
      `INSERT INTO activity_feed (id, user_id, actor_id, activity_type, content_type, content_id, metadata, created_at)
       VALUES (?, ?, ?, 'project_create', 'project', ?, ?, ?)`
    )
      .bind(
        uuid(),
        owner,
        owner,
        projectId,
        JSON.stringify({ title: demoTitles.get(projectId) }),
        new Date(Date.now() - index * 3 * 864e5).toISOString()
      )
      .run();
  }

  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, actor_id, type, title, body, link, read, created_at) VALUES
      (?, ?, ?, 'follow', 'New follower', 'Mara Lindqvist started following you', '/discover', 0, ?),
      (?, ?, ?, 'reaction', 'New reaction', 'Tobi Adeyemi reacted to your project', '/projects', 0, ?),
      (?, ?, ?, 'message', 'New enquiry', 'Dana Whitfield sent you a message', '/messages', 1, ?)`
  )
    .bind(
      uuid(), owner, ids.get('mara'), new Date(Date.now() - 3600e3).toISOString(),
      uuid(), owner, ids.get('tobi'), new Date(Date.now() - 7200e3).toISOString(),
      uuid(), owner, null, new Date(Date.now() - 86400e3).toISOString()
    )
    .run();

  return { seeded: true, ...results };
}

export async function wipeDemoData(env: Env) {
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM analytics_events`),
    env.DB.prepare(`DELETE FROM activity_feed`),
    env.DB.prepare(`DELETE FROM notifications`),
    env.DB.prepare(`DELETE FROM reactions`),
    env.DB.prepare(`DELETE FROM comments`),
    env.DB.prepare(`DELETE FROM testimonials`),
    env.DB.prepare(`DELETE FROM skill_endorsements`),
    env.DB.prepare(`DELETE FROM contact_messages`),
    env.DB.prepare(`DELETE FROM direct_messages`),
    env.DB.prepare(`DELETE FROM message_threads`),
    env.DB.prepare(`DELETE FROM media_uploads`),
    env.DB.prepare(`DELETE FROM bookmarks`),
    env.DB.prepare(`DELETE FROM user_follows`),
    env.DB.prepare(`DELETE FROM blog_posts`),
    env.DB.prepare(`DELETE FROM projects`),
    env.DB.prepare(`DELETE FROM skills`),
    env.DB.prepare(`DELETE FROM experiences`),
    env.DB.prepare(`DELETE FROM education`),
    env.DB.prepare(`DELETE FROM portfolio_sections`),
    env.DB.prepare(`DELETE FROM themes`),
    env.DB.prepare(`DELETE FROM resumes`),
    env.DB.prepare(`DELETE FROM usernames`),
    env.DB.prepare(`DELETE FROM user_roles`),
    env.DB.prepare(`DELETE FROM sessions`),
    env.DB.prepare(`DELETE FROM users`),
  ]);
  return { wiped: true };
}

async function count(env: Env, table: string) {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${table}`).first<{ c: number }>();
  return row?.c ?? 0;
}
