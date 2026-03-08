-- Migration: Create Incident Reports table and storage bucket

-- ENUMS for Incident Reports
CREATE TYPE public.incident_severity AS ENUM ('Warning', 'Critical');
CREATE TYPE public.incident_type AS ENUM ('Injury', 'Property_Damage', 'Tardiness', 'Workmanship', 'Conduct');

-- Table: incident_reports
CREATE TABLE public.incident_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    severity public.incident_severity NOT NULL,
    type public.incident_type NOT NULL,
    notes TEXT NOT NULL,
    photo_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for incident_reports
CREATE INDEX idx_incident_reports_booking_id ON public.incident_reports(booking_id);
CREATE INDEX idx_incident_reports_company_id ON public.incident_reports(company_id);
CREATE INDEX idx_incident_reports_reported_by ON public.incident_reports(reported_by);

-- Enable RLS
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Incident Reports RLS Policies
CREATE POLICY "Users can view incident reports for their company"
    ON public.incident_reports FOR SELECT
    USING (company_id = current_setting('app.current_company_id', true)::uuid);

CREATE POLICY "Users can insert incident reports for their company"
    ON public.incident_reports FOR INSERT
    WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);

CREATE POLICY "Users can update incident reports for their company"
    ON public.incident_reports FOR UPDATE
    USING (company_id = current_setting('app.current_company_id', true)::uuid);

-- Storage bucket for incident_photos
INSERT INTO storage.buckets (id, name, public) VALUES ('incident_photos', 'incident_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for incident_photos
CREATE POLICY "Authenticated users can upload incident photos"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'incident_photos' AND auth.role() = 'authenticated' );

CREATE POLICY "Public can view incident photos"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'incident_photos' );

CREATE POLICY "Users can update their own incident photos"
    ON storage.objects FOR UPDATE
    USING ( bucket_id = 'incident_photos' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own incident photos"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'incident_photos' AND auth.uid() = owner );
