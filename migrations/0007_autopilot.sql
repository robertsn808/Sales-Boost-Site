-- AI Autopilot: automated prospecting, outreach, follow-ups

-- Autopilot configuration (singleton)
CREATE TABLE IF NOT EXISTS autopilot_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_prospect_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  prospect_locations TEXT NOT NULL DEFAULT 'Honolulu, Hawaii',
  prospect_verticals TEXT NOT NULL DEFAULT 'restaurant,retail,salon',
  max_prospects_per_run INTEGER NOT NULL DEFAULT 10,
  auto_outreach_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  outreach_delay_hours INTEGER NOT NULL DEFAULT 2,
  max_outreach_per_day INTEGER NOT NULL DEFAULT 15,
  auto_follow_up_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_after_days INTEGER NOT NULL DEFAULT 3,
  max_follow_ups_per_lead INTEGER NOT NULL DEFAULT 3,
  auto_enrich_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TEXT NOT NULL DEFAULT '',
  total_prospected INTEGER NOT NULL DEFAULT 0,
  total_emailed INTEGER NOT NULL DEFAULT 0,
  total_follow_ups INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Outreach queue for AI-generated emails
CREATE TABLE IF NOT EXISTS outreach_queue (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'initial',
  status TEXT NOT NULL DEFAULT 'pending',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  scheduled_for TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outreach_queue_status ON outreach_queue(status);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_lead_id ON outreach_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_scheduled ON outreach_queue(scheduled_for);
