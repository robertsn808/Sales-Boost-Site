-- Add assignee field to tasks table for per-user task assignment
ALTER TABLE tasks ADD COLUMN assignee TEXT NOT NULL DEFAULT '';
