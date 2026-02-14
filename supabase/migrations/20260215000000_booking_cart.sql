-- Migration: Booking Cart & Enhancements (Epic 4)

-- 1. Create 'cart_items' table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: Prevent duplicate worker assignment to same work order in cart
  UNIQUE(work_order_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_borrower ON cart_items(borrower_company_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_work_order ON cart_items(work_order_id);

-- 2. Enhance 'bookings' table
-- Add FK to work_orders to track which requirement this booking fulfills
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES work_orders(id);

-- 3. RLS Policies
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view/manage their cart"
ON cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = cart_items.borrower_company_id
    AND company_members.user_id = auth.uid()
    AND company_members.status = 'Active'
  )
);
