-- Add city, state, and zip_code columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lng NUMERIC;

-- Update existing addresses if possible (optional/best effort)
-- This is hard to do reliably without a proper geocoder/parser, 
-- but we can leave existing ones as is since they'll be updated 
-- when users re-save their info.
