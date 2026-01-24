-- Add xp_reward column to programs table
ALTER TABLE programs ADD COLUMN xp_reward INTEGER DEFAULT 50;
