-- Migration 0014: Add detailed equipment tracking fields
-- Adds brand, firmware, part number, product code, feature code, app code, connectivity, manufacture date

ALTER TABLE equipment ADD COLUMN brand TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN firmware_version TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN part_number TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN product_code TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN feature_code TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN app_code TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN connectivity TEXT NOT NULL DEFAULT '';
ALTER TABLE equipment ADD COLUMN manufacture_date TEXT NOT NULL DEFAULT '';
