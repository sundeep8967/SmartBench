-- Create project_photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project_photos', 'project_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for project_photos
CREATE POLICY "Public Project Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project_photos');

CREATE POLICY "Authenticated users can upload project photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'project_photos' 
    AND auth.uid() = owner
);

CREATE POLICY "Users can update their own project photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'project_photos' 
    AND auth.uid() = owner
);

CREATE POLICY "Users can delete their own project photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'project_photos' 
    AND auth.uid() = owner
);
