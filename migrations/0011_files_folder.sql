-- Add folder column to admin_files for file manager folder support
ALTER TABLE admin_files ADD COLUMN folder TEXT NOT NULL DEFAULT '';
