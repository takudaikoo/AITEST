-- Add grading_prompt column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS grading_prompt text;
