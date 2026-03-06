-- Restore admin_sessions table (dropped by 0002 but still needed by Cloudflare Workers auth)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- Admin settings table (used by password-based auth flow)
CREATE TABLE IF NOT EXISTS admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  password_hash TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
