-- Add is_mandatory column to programs table
ALTER TABLE programs ADD COLUMN is_mandatory BOOLEAN DEFAULT false;
