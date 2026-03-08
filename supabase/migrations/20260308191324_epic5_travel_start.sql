ALTER TABLE public.time_entries
ADD COLUMN travel_start TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.time_entries.travel_start IS 'Timestamp when the worker clicked Start Travel';
