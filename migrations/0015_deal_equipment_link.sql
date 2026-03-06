-- Migration 0015: Link equipment to deals
ALTER TABLE opportunities ADD COLUMN equipment_id TEXT NOT NULL DEFAULT '';
