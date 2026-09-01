-- Durable per-key request buckets. D1 serializes the upsert so the Worker is not
-- dependent on an isolate-local in-memory map for abuse controls.
CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_reset ON api_rate_limits(reset_at);
