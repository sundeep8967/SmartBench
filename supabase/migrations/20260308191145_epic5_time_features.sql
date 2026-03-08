-- Migration: Add Travel Time and Draft Mode support to time_entries

ALTER TABLE public.time_entries
ADD COLUMN travel_duration_minutes INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN is_draft BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;

-- Add "Draft" to the status ENUM constraints if it is checked at the application layer, or if it is an actual ENUM
-- Currently status is text, so we don't need to alter an ENUM.

COMMENT ON COLUMN public.time_entries.travel_duration_minutes IS 'Total travel time tracked between project sites in minutes';
COMMENT ON COLUMN public.time_entries.is_draft IS 'If true, the timesheet is still pending worker review and isn''t visible to supervisors yet';
COMMENT ON COLUMN public.time_entries.submitted_at IS 'Timestamp when the worker approved the draft timesheet';
