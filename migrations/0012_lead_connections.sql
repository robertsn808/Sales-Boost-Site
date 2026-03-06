-- Wire up disconnected systems: statement analysis, referral tracking, scoring, tech scan
ALTER TABLE leads ADD COLUMN statement_grade TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN statement_overpay TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN statement_data TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN referral_partner_id TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN lead_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN lead_score_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN tech_stack TEXT NOT NULL DEFAULT '';
