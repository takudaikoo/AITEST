-- Add level_requirement column to programs table
ALTER TABLE programs ADD COLUMN level_requirement INTEGER DEFAULT 1;
