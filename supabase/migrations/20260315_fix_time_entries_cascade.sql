-- Migration: Add ON DELETE CASCADE to time_entries_project_id_fkey
ALTER TABLE public.time_entries
DROP CONSTRAINT IF EXISTS time_entries_project_id_fkey,
ADD CONSTRAINT time_entries_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;
