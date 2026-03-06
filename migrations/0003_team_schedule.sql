-- Team, Business, Schedule, Pinned Pitches - D1 Migration

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  daily_involvement TEXT NOT NULL DEFAULT 'full',
  joined_at TEXT NOT NULL
);

-- Seed team
INSERT OR IGNORE INTO team_members (id, name, role, email, phone, status, daily_involvement, joined_at) VALUES
  ('tm-aaron', 'Aaron', 'Investor & Financial Backer', '', '', 'active', 'minimal', datetime('now')),
  ('tm-joey', 'Joey', 'Business Operations & Legal (EIN, compliance, registration)', '', '', 'active', 'part-time', datetime('now')),
  ('tm-kepa', 'Kepa', 'Lead Sales & CashSwipe Point of Contact', '', '', 'active', 'full', datetime('now')),
  ('tm-jessica', 'Jessica', 'CRM Development, Website, & Marketing Materials', '', '', 'active', 'full', datetime('now'));

-- Business info (singleton)
CREATE TABLE IF NOT EXISTS business_info (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT '',
  dba TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  bank_partner TEXT NOT NULL DEFAULT '',
  processor_partner TEXT NOT NULL DEFAULT 'CashSwipe',
  current_phase TEXT NOT NULL DEFAULT 'onboarding',
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO business_info (id, updated_at) VALUES ('default', datetime('now'));

-- Schedule items
CREATE TABLE IF NOT EXISTS schedule_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 30,
  assignee_id TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  is_ai_generated INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TEXT NOT NULL
);

-- Pinned pitches
CREATE TABLE IF NOT EXISTS pinned_pitches (
  id TEXT PRIMARY KEY,
  script_key TEXT NOT NULL,
  custom_content TEXT NOT NULL DEFAULT '',
  pinned_at TEXT NOT NULL
);
