-- Saved Searches Support

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  search_criteria JSONB NOT NULL,
  alert_preference VARCHAR(50) NOT NULL DEFAULT 'Daily_Digest',
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Chicago',
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_borrower ON saved_searches(borrower_company_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_alert_preference ON saved_searches(alert_preference);

-- RLS Policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company's saved searches" ON saved_searches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM company_members WHERE user_id = auth.uid() AND company_id = saved_searches.borrower_company_id)
  );
