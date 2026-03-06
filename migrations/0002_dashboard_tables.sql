-- Dashboard Tables Migration - All in-memory stores → D1

-- Recreate leads table with all fields (drop old minimal version)
DROP TABLE IF EXISTS leads;
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  business TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  decision_maker_name TEXT NOT NULL DEFAULT '',
  decision_maker_role TEXT NOT NULL DEFAULT '',
  best_contact_method TEXT NOT NULL DEFAULT 'phone',
  package TEXT NOT NULL DEFAULT 'terminal',
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'direct',
  vertical TEXT NOT NULL DEFAULT 'other',
  current_processor TEXT NOT NULL DEFAULT '',
  current_equipment TEXT NOT NULL DEFAULT '',
  monthly_volume TEXT NOT NULL DEFAULT '',
  pain_points TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT '',
  next_step_date TEXT NOT NULL DEFAULT '',
  attachments TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Recreate clients with all fields
DROP TABLE IF EXISTS clients;
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  business TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  package TEXT NOT NULL DEFAULT 'terminal',
  maintenance TEXT NOT NULL DEFAULT 'none',
  website_url TEXT NOT NULL DEFAULT '',
  website_status TEXT NOT NULL DEFAULT 'not-started',
  terminal_id TEXT NOT NULL DEFAULT '',
  monthly_volume REAL NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

-- Recreate revenue with boolean field
DROP TABLE IF EXISTS revenue;
CREATE TABLE IF NOT EXISTS revenue (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  client_id TEXT NOT NULL DEFAULT '',
  recurring INTEGER NOT NULL DEFAULT 0
);

-- Recreate tasks
DROP TABLE IF EXISTS tasks;
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  completed INTEGER NOT NULL DEFAULT 0,
  linked_to TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- Admin files
CREATE TABLE IF NOT EXISTS admin_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'untitled',
  size INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'document',
  category TEXT NOT NULL DEFAULT 'general',
  uploaded_at TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT ''
);

-- Slack config (singleton)
CREATE TABLE IF NOT EXISTS slack_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  webhook_url TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT '#general',
  enabled INTEGER NOT NULL DEFAULT 0,
  notify_new_lead INTEGER NOT NULL DEFAULT 1,
  notify_new_client INTEGER NOT NULL DEFAULT 1,
  notify_revenue INTEGER NOT NULL DEFAULT 0,
  notify_task_due INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO slack_config (id) VALUES ('default');

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'webhook',
  enabled INTEGER NOT NULL DEFAULT 0,
  config TEXT NOT NULL DEFAULT '{}',
  last_sync TEXT NOT NULL DEFAULT ''
);

-- Referral partners
CREATE TABLE IF NOT EXISTS referral_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  client_types TEXT NOT NULL DEFAULT '',
  referral_terms TEXT NOT NULL DEFAULT '',
  intro_method TEXT NOT NULL DEFAULT '',
  tracking_notes TEXT NOT NULL DEFAULT '',
  last_check_in TEXT NOT NULL DEFAULT '',
  next_check_in TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- Playbook checks
CREATE TABLE IF NOT EXISTS playbook_checks (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT ''
);

-- Weekly KPIs
CREATE TABLE IF NOT EXISTS weekly_kpis (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL DEFAULT '',
  outbound_calls INTEGER NOT NULL DEFAULT 0,
  outbound_emails INTEGER NOT NULL DEFAULT 0,
  outbound_dms INTEGER NOT NULL DEFAULT 0,
  walk_ins INTEGER NOT NULL DEFAULT 0,
  contacts_made INTEGER NOT NULL DEFAULT 0,
  appointments_set INTEGER NOT NULL DEFAULT 0,
  statements_requested INTEGER NOT NULL DEFAULT 0,
  statements_received INTEGER NOT NULL DEFAULT 0,
  proposals_sent INTEGER NOT NULL DEFAULT 0,
  deals_won INTEGER NOT NULL DEFAULT 0,
  volume_won REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);

-- 90-day plan items
CREATE TABLE IF NOT EXISTS plan_items (
  id TEXT PRIMARY KEY,
  phase INTEGER NOT NULL DEFAULT 1,
  week_range TEXT NOT NULL DEFAULT '1-2',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Materials checklist
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'sales',
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not-started',
  file_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'sales-materials',
  type TEXT NOT NULL DEFAULT 'doc',
  url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT ''
);

-- Keep admin_sessions table (used by Cloudflare Workers auth)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
