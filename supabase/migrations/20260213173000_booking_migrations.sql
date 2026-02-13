-- Migration for Booking Domain (Epic 1.5)
-- Creates projects and bookings tables with financial fields

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE, -- Borrower Company
  address TEXT NOT NULL,
  timezone VARCHAR(50) NOT NULL, -- e.g., 'America/Chicago'
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_jurisdiction_id ON projects(jurisdiction_id);

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  borrower_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lender_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  status VARCHAR(50) NOT NULL, 
  -- ENUM: 'Pending_Payment', 'Confirmed', 'Active', 'Suspended_Insurance', 'Disputed', 'Payment_Paused_Dispute', 'Completed', 'Cancelled'
  
  funded_period_end TIMESTAMP, -- nullable, for weekly progress payments
  payment_type VARCHAR(50) NOT NULL, -- ENUM: 'Full_Upfront' | 'Weekly_Progress'
  currency_code VARCHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
  
  -- Financial Fields (Integers in cents)
  total_amount BIGINT NOT NULL DEFAULT 0,
  service_fee_amount BIGINT NOT NULL DEFAULT 0,
  worker_payout_amount BIGINT NOT NULL DEFAULT 0,
  
  termination_notice_days INTEGER,
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  primary_site_contact_id UUID REFERENCES users(id),
  ot_terms_snapshot JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT bookings_date_range_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_project_id ON bookings(project_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_borrower_company_id ON bookings(borrower_company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lender_company_id ON bookings(lender_company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_weekly_payment ON bookings(payment_type, status, funded_period_end) 
  WHERE payment_type = 'Weekly_Progress';

-- 3. RLS Policies (Basic Permissions for MVP)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Projects: Accessible by company members
CREATE POLICY "Company members can view their projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = projects.company_id
    AND company_members.user_id = auth.uid()
    AND company_members.status = 'Active'
  )
);

-- Bookings: Accessible by Borrower, Lender, and Worker
CREATE POLICY "Users can view relevant bookings"
ON bookings FOR SELECT
USING (
  -- As Worker
  worker_id = auth.uid() OR
  -- As Borrower Company Member
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = bookings.borrower_company_id
    AND company_members.user_id = auth.uid()
    AND company_members.status = 'Active'
  ) OR
  -- As Lender Company Member
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = bookings.lender_company_id
    AND company_members.user_id = auth.uid()
    AND company_members.status = 'Active'
  )
);
