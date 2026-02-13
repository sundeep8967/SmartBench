-- Enable RLS on insurance_policies
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

-- 1. View Policies: Members of the company can view policies
CREATE POLICY "Company members can view insurance policies"
ON insurance_policies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id = insurance_policies.company_id
    AND cm.status = 'Active'
  )
);

-- 2. Manage Policies: Admins/Managers can insert/update
CREATE POLICY "Admins and Managers can manage insurance policies"
ON insurance_policies FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id = insurance_policies.company_id
    AND cm.status = 'Active'
    AND (cm.roles @> '["Admin"]' OR cm.roles @> '["Manager"]')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.company_id = insurance_policies.company_id
    AND cm.status = 'Active'
    AND (cm.roles @> '["Admin"]' OR cm.roles @> '["Manager"]')
  )
);
