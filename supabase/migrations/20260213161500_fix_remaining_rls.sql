-- Fix RLS policies to allow invitation flow and dashboard access

-- 1. Allow Users to UPDATE their own invitations (to mark as 'accepted')
CREATE POLICY "Users can update their own invitations"
ON company_invitations
FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email')
);

-- 2. Ensure RLS is enabled on company_members
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- 3. Allow Users to VIEW their own memberships (Critical for Dashboard/Select Company)
CREATE POLICY "Users can view their own memberships"
ON company_members
FOR SELECT
USING (
  user_id = auth.uid()
);

-- 4. Allow Users to INSERT themselves if they have a checks-out pending invite
CREATE POLICY "Users can join company with valid invite"
ON company_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM company_invitations
    WHERE email = (auth.jwt() ->> 'email')
    AND company_id = company_members.company_id
    AND status = 'pending'
  )
);
