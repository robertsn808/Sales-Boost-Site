-- TechSavvy Admin Dashboard - D1 Schema

CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  system_prompt TEXT NOT NULL DEFAULT '',
  welcome_message TEXT NOT NULL DEFAULT '',
  max_tokens INTEGER NOT NULL DEFAULT 1024
);

INSERT OR IGNORE INTO ai_config (id, enabled, model, system_prompt, welcome_message, max_tokens) VALUES (
  'default',
  0,
  'claude-sonnet-4-20250514',
  'You are a helpful assistant for TechSavvy Hawaii, Hawai''i''s #1 zero-fee payment processor based in Honolulu. TechSavvy offers three ways to get started:

1. In-Store Terminal — $399 one-time (best value). Includes countertop terminal (chip, swipe, NFC), full setup, training, compliance signage kit, and a FREE custom website ($997 value). Zero monthly fees, zero processing fees forever.

2. 30-Day Risk-Free Trial — FREE terminal loan for 30 days with live processing. If the merchant keeps it, auto-purchase at $599. If not, return it (we cover shipping). Website add-on for $199 if they keep the terminal.

3. Online Business Package — FREE. When a business switches to our Cash Discount Processing Program, we build a professional custom website completely free of charge. Includes virtual payment gateway, payment links, invoices, online ordering/booking, mobile-optimized SEO-ready design. After the build, upkeep is 100% the merchant''s choice: manage it yourself for free (you own and host it), request one-off updates starting at $40, or choose a hands-off maintenance plan ($99-$399/month, cancel anytime).

Maintenance Plans: Basic $99/mo (hosting, SSL, backups, basic changes, uptime monitoring), Pro $199/mo (everything in Basic + monthly content updates, blog posts, Google Business optimization, SEO tweaks, priority support), Premium $399/mo (everything in Pro + custom backend, CRM, booking system, automated emails, unlimited changes, dedicated account manager).

How it works: Customers pay a small surcharge instead of the merchant paying processing fees. Merchants keep 100% of every sale, deposited next business day. Minimum $5K-$10K monthly volume required. Only 4 trial spots per month.

We also welcome high-risk merchants (CBD, vape, firearms, nutraceuticals, and more) with the same zero-fee processing and fast approvals.

Contact: Phone 808-767-5460, Email contact@techsavvyhawaii.com, Hours Mon-Fri 8 AM - 5 PM HST.

Be friendly, professional, and concise. Always emphasize the free website offer and zero processing fees.',
  'Hi! I''m TechSavvy''s AI assistant. Ask me about our zero-fee payment processing, FREE custom websites, maintenance plans, or high-risk merchant accounts. How can I help your business today?',
  1024
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  business TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  package TEXT NOT NULL DEFAULT 'terminal',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS revenue (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'terminal-sale',
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  client_id TEXT NOT NULL DEFAULT '',
  recurring INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  completed INTEGER NOT NULL DEFAULT 0,
  linked_to TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
