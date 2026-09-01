-- Per-portfolio presentation settings. Theme values are normalized before they are persisted or returned publicly.
CREATE TABLE IF NOT EXISTS portfolio_themes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portfolio_themes_user ON portfolio_themes(user_id);
