-- A singleton row makes first-admin provisioning safe across concurrent
-- requests. Existing administrators are still detected from user_roles.
CREATE TABLE IF NOT EXISTS admin_bootstrap_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1)
);
