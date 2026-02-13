-- Add contact_phone to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
