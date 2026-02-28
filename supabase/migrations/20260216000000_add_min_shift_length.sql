-- Add minimum_shift_length_hours to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS minimum_shift_length_hours INTEGER DEFAULT 8;
