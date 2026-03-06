-- Add folder column for inbox/sent/spam/trash/archived organization
ALTER TABLE email_threads ADD COLUMN folder TEXT NOT NULL DEFAULT 'inbox';

-- Add starred/flagged support
ALTER TABLE email_threads ADD COLUMN starred INTEGER NOT NULL DEFAULT 0;

-- Add AI classification metadata
ALTER TABLE email_threads ADD COLUMN ai_intent TEXT NOT NULL DEFAULT '';
ALTER TABLE email_threads ADD COLUMN ai_priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE email_threads ADD COLUMN ai_sentiment TEXT NOT NULL DEFAULT 'neutral';

-- Index for fast folder queries
CREATE INDEX idx_email_threads_folder ON email_threads(folder);
CREATE INDEX idx_email_threads_starred ON email_threads(starred);
