-- Migration for Worker Invitations (Epic 1.4)
-- Creates a table to track pending email invitations

CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Worker', -- 'Admin', 'Manager', 'Supervisor', 'Worker'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(status);

-- Add RLS Policies
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins/Managers can view invites for their company
CREATE POLICY "Admins/Managers can view their company invitations"
ON company_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.user_id = auth.uid()
    AND company_members.company_id = company_invitations.company_id
    AND company_members.status = 'Active'
    AND company_members.roles ?| ARRAY['Admin', 'Manager']
  )
);

-- Policy: Admins/Managers can create invites
CREATE POLICY "Admins/Managers can create invites"
ON company_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.user_id = auth.uid()
    AND company_members.company_id = company_invitations.company_id
    AND company_members.status = 'Active'
    AND company_members.roles ?| ARRAY['Admin', 'Manager']
  )
);

-- Policy: Admins/Managers can update/delete invites (e.g., revoke)
CREATE POLICY "Admins/Managers can update their company invitations"
ON company_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.user_id = auth.uid()
    AND company_members.company_id = company_invitations.company_id
    AND company_members.status = 'Active'
    AND company_members.roles ?| ARRAY['Admin', 'Manager']
  )
);
