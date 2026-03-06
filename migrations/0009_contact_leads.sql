-- Contact form leads table (was defined in schema.ts but never had a migration)
CREATE TABLE IF NOT EXISTS contact_leads (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT '',
  high_risk INTEGER NOT NULL DEFAULT 0,
  monthly_processing TEXT NOT NULL DEFAULT '',
  best_contact_time TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
