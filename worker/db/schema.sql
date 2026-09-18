-- ============================================================================
--  Portify Developer Hub — Cloudflare D1 schema
--  Run:  npm run db:migrate:local     (local .wrangler state)
--        npm run db:migrate:remote    (production D1)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- identity --
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  password_salt   TEXT,
  password_iter   INTEGER DEFAULT 210000,
  provider        TEXT NOT NULL DEFAULT 'password',   -- password | github | google
  provider_id     TEXT,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  metadata        TEXT NOT NULL DEFAULT '{}',
  last_sign_in_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_provider ON users (provider, provider_id);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  user_agent   TEXT,
  ip           TEXT,
  expires_at   TEXT NOT NULL,
  revoked_at   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,                 -- password_reset | email_verify
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens (user_id, kind);

CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id);

-- ---------------------------------------------------------------- profiles --
CREATE TABLE IF NOT EXISTS profiles (
  id            TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  full_name     TEXT,
  display_name  TEXT,
  title         TEXT,
  bio           TEXT,
  long_bio      TEXT,
  location      TEXT,
  timezone      TEXT,
  pronouns      TEXT,
  availability  TEXT DEFAULT 'open',        -- open | busy | hiring | unavailable
  email         TEXT,
  phone         TEXT,
  website       TEXT,
  github        TEXT,
  linkedin      TEXT,
  twitter       TEXT,
  instagram     TEXT,
  youtube       TEXT,
  dribbble      TEXT,
  resume_url    TEXT,
  avatar_url    TEXT,
  cover_url     TEXT,
  accent        TEXT DEFAULT '#7c5cff',
  is_public     INTEGER NOT NULL DEFAULT 1,
  is_verified   INTEGER NOT NULL DEFAULT 0,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  profile_views INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (lower(username));

-- Vanity-URL table kept for backwards compatibility with the original client.
CREATE TABLE IF NOT EXISTS usernames (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  username   TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_usernames_user ON usernames (user_id);

-- ---------------------------------------------------------------- portfolio --
CREATE TABLE IF NOT EXISTS projects (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  slug             TEXT,
  description      TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  tags             TEXT DEFAULT '[]',        -- JSON array
  image_url        TEXT,
  gallery          TEXT DEFAULT '[]',        -- JSON array
  repo_url         TEXT,
  demo_url         TEXT,
  category         TEXT DEFAULT 'web',
  status           TEXT DEFAULT 'shipped',   -- concept | wip | shipped | archived
  role             TEXT,
  featured         INTEGER NOT NULL DEFAULT 0,
  stars            INTEGER DEFAULT 0,
  forks            INTEGER DEFAULT 0,
  contributors     INTEGER DEFAULT 0,
  views            INTEGER NOT NULL DEFAULT 0,
  source           TEXT DEFAULT 'manual',    -- manual | github | import
  github_id        TEXT,
  start_date       TEXT,
  end_date         TEXT,
  is_public        INTEGER NOT NULL DEFAULT 1,
  position         INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects (is_public, featured);

CREATE TABLE IF NOT EXISTS skills (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'languages',
  proficiency   INTEGER NOT NULL DEFAULT 60,
  icon_url      TEXT,
  year_acquired INTEGER,
  endorsed      INTEGER NOT NULL DEFAULT 0,
  description   TEXT,
  is_public     INTEGER NOT NULL DEFAULT 1,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_user_name ON skills (user_id, lower(name));

CREATE TABLE IF NOT EXISTS skill_endorsements (
  id           TEXT PRIMARY KEY,
  skill_id     TEXT NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
  endorser_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  comment      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (skill_id, endorser_id)
);

CREATE TABLE IF NOT EXISTS experiences (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  position     TEXT NOT NULL,
  employment   TEXT DEFAULT 'full-time',
  location     TEXT,
  start_date   TEXT,
  end_date     TEXT,
  description  TEXT,
  logo_url     TEXT,
  company_url  TEXT,
  technologies TEXT DEFAULT '[]',            -- JSON array
  projects     TEXT DEFAULT '[]',            -- JSON array
  is_public    INTEGER NOT NULL DEFAULT 1,
  position_order INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_experiences_user ON experiences (user_id);

CREATE TABLE IF NOT EXISTS education (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree      TEXT,
  field       TEXT,
  location    TEXT,
  start_date  TEXT,
  end_date    TEXT,
  description TEXT,
  logo_url    TEXT,
  is_public   INTEGER NOT NULL DEFAULT 1,
  position_order INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_education_user ON education (user_id);

CREATE TABLE IF NOT EXISTS blog_posts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  excerpt         TEXT DEFAULT '',
  content         TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  category        TEXT DEFAULT 'engineering',
  series          TEXT,
  tags            TEXT DEFAULT '[]',
  reading_time    INTEGER DEFAULT 5,
  views           INTEGER NOT NULL DEFAULT 0,
  likes           INTEGER NOT NULL DEFAULT 0,
  published       INTEGER NOT NULL DEFAULT 0,
  is_public       INTEGER NOT NULL DEFAULT 1,
  featured        INTEGER NOT NULL DEFAULT 0,
  publish_date    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_user ON blog_posts (user_id);

CREATE TABLE IF NOT EXISTS portfolio_sections (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       TEXT NOT NULL,                  -- about | projects | skills | experience | education | blog | contact | custom
  title      TEXT NOT NULL,
  subtitle   TEXT,
  content    TEXT DEFAULT '{}',              -- JSON
  visible    INTEGER NOT NULL DEFAULT 1,
  position_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sections_user ON portfolio_sections (user_id, position_order);

CREATE TABLE IF NOT EXISTS themes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'Default',
  config     TEXT NOT NULL DEFAULT '{}',     -- JSON: colors, typography, layout
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_themes_user ON themes (user_id);

CREATE TABLE IF NOT EXISTS resumes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT 'My Resume',
  template   TEXT NOT NULL DEFAULT 'modern',
  content    TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes (user_id);

-- ------------------------------------------------------------------ social --
CREATE TABLE IF NOT EXISTS user_follows (
  id           TEXT PRIMARY KEY,
  follower_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows (following_id);

CREATE TABLE IF NOT EXISTS comments (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('project', 'blog_post', 'profile')),
  content_id   TEXT NOT NULL,
  content      TEXT NOT NULL,
  parent_id    TEXT REFERENCES comments (id) ON DELETE CASCADE,
  is_edited    INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id);

CREATE TABLE IF NOT EXISTS reactions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('project', 'blog_post', 'comment', 'profile')),
  content_id    TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'celebrate', 'insightful', 'funny')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, content_type, content_id, reaction_type)
);
CREATE INDEX IF NOT EXISTS idx_reactions_content ON reactions (content_type, content_id);

CREATE TABLE IF NOT EXISTS bookmarks (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, content_type, content_id)
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,  -- feed owner (recipient)
  actor_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,               -- follow | project_create | blog_post_create | comment | reaction | endorsement
  content_type  TEXT,
  content_id    TEXT,
  metadata      TEXT DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_feed (actor_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  actor_id   TEXT REFERENCES users (id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  body       TEXT DEFAULT '',
  link       TEXT,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS testimonials (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,   -- recipient
  author_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  author_name TEXT,
  author_title TEXT,
  company     TEXT,
  text        TEXT NOT NULL,
  rating      INTEGER DEFAULT 5,
  approved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_testimonials_user ON testimonials (user_id, approved);

-- --------------------------------------------------------------- messaging --
CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  company    TEXT,
  budget     TEXT,
  recipient_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  starred    INTEGER NOT NULL DEFAULT 0,
  replied_at TEXT,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_recipient ON contact_messages (recipient_id, read);

CREATE TABLE IF NOT EXISTS message_threads (
  id              TEXT PRIMARY KEY,
  participant_a   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  participant_b   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject         TEXT,
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (participant_a, participant_b)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id         TEXT PRIMARY KEY,
  thread_id  TEXT NOT NULL REFERENCES message_threads (id) ON DELETE CASCADE,
  sender_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  read_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dm_thread ON direct_messages (thread_id, created_at);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT DEFAULT 'footer',
  confirmed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------- site & content --
CREATE TABLE IF NOT EXISTS site_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL DEFAULT '{}',     -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media_uploads (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  url         TEXT NOT NULL,
  filename    TEXT,
  content_type TEXT,
  size        INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------------------- analytics --
CREATE TABLE IF NOT EXISTS analytics_events (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT REFERENCES users (id) ON DELETE CASCADE,   -- whose portfolio
  viewer_id   TEXT,
  session_key TEXT,
  event_type  TEXT NOT NULL DEFAULT 'page_view',
  path        TEXT,
  referrer    TEXT,
  country     TEXT,
  city        TEXT,
  device      TEXT,
  browser     TEXT,
  os          TEXT,
  metadata    TEXT DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analytics_owner ON analytics_events (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor_id   TEXT,
  action     TEXT NOT NULL,
  target     TEXT,
  metadata   TEXT DEFAULT '{}',
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL DEFAULT (datetime('now'))
);
