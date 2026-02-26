-- Drop old fields
ALTER TABLE projects DROP COLUMN IF EXISTS start_date;
ALTER TABLE projects DROP COLUMN IF EXISTS end_date;
ALTER TABLE projects DROP COLUMN IF EXISTS status;

-- Add new fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS daily_start_time TIME;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meeting_location_type VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meeting_instructions TEXT;

-- Migrate any existing descriptions over (optional if 'description' existed)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
        UPDATE projects SET project_description = description;
        ALTER TABLE projects DROP COLUMN description;
    END IF;
END $$;
