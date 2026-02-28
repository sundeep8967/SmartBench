-- Add minimum_shift_length_hours to projects table to allow project-level overrides 
-- of the company default setting.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS minimum_shift_length_hours INTEGER;
