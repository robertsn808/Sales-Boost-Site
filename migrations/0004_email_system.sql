-- Email Threads
CREATE TABLE IF NOT EXISTS email_threads (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT '',
  lead_id TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'direct',
  status TEXT NOT NULL DEFAULT 'open',
  unread BOOLEAN NOT NULL DEFAULT true,
  last_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Email Messages
CREATE TABLE IF NOT EXISTS email_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'inbound',
  from_email TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  to_email TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  resend_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TEXT NOT NULL
);

-- Outreach Templates
CREATE TABLE IF NOT EXISTS outreach_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'cold',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Call Scripts
CREATE TABLE IF NOT EXISTS call_scripts (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  script TEXT NOT NULL DEFAULT '',
  talking_points TEXT NOT NULL DEFAULT '[]',
  objections TEXT NOT NULL DEFAULT '[]',
  generated_at TEXT NOT NULL
);

-- Resend Config (singleton)
CREATE TABLE IF NOT EXISTS resend_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT false,
  from_email TEXT NOT NULL DEFAULT 'contact@techsavvyhawaii.com',
  from_name TEXT NOT NULL DEFAULT 'TechSavvy Hawaii',
  auto_confirm_enabled BOOLEAN NOT NULL DEFAULT true,
  forward_copy_to TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

-- Insert default config
INSERT INTO resend_config (id, enabled, from_email, from_name, auto_confirm_enabled, forward_copy_to, updated_at)
VALUES ('default', false, 'contact@techsavvyhawaii.com', 'TechSavvy Hawaii', true, '', '')
ON CONFLICT (id) DO NOTHING;
