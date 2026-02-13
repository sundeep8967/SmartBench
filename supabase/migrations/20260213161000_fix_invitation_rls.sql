-- Fix RLS policy for company_invitations
-- Allow authenticated users to view invitations sent to their email

CREATE POLICY "Users can view invitations for their email"
ON company_invitations
FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
);
