-- Migration: Project Enhancements & Work Orders (Epic 3)

-- 1. Enhance 'projects' table (Missing fields from initial stub)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Active'; -- 'Planning', 'Active', 'Completed', 'Archived'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Create 'work_orders' table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL, -- e.g. 'Framer', 'Electrician'
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Open', 'Filled', 'Completed'
  description TEXT,
  hourly_rate_min DECIMAL(10,2), -- Optional budget range
  hourly_rate_max DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_work_order_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_work_orders_project_id ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- 3. RLS Policies
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Company members can view/edit work orders for their projects
CREATE POLICY "Company members can view their project work orders"
ON work_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    JOIN company_members ON company_members.company_id = projects.company_id
    WHERE projects.id = work_orders.project_id
    AND company_members.user_id = auth.uid()
    AND company_members.status = 'Active'
  )
);

CREATE POLICY "Company admins/managers can manage work orders"
ON work_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects
    JOIN company_members ON company_members.company_id = projects.company_id
    WHERE projects.id = work_orders.project_id
    AND company_members.user_id = auth.uid()
    AND company_members.status = 'Active'
    AND (company_members.roles ? 'Admin' OR company_members.roles ? 'Manager')
  )
);
