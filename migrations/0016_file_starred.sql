-- Add starred column to admin_files for quick access favorites
ALTER TABLE admin_files ADD COLUMN starred INTEGER NOT NULL DEFAULT 0;
