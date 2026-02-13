-- Marketplace Domain Migrations
-- Includes: zip_codes, worker_profiles, worker_availability, cart_items, saved_searches, worker_rates

-- 1. zip_codes (Lookup table)
CREATE TABLE IF NOT EXISTS zip_codes (
  zip_code VARCHAR(10) PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zip_codes_coordinates ON zip_codes(latitude, longitude);

-- 2. worker_profiles
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade VARCHAR(100),
  skills JSONB, -- ['Framing', 'Drywall']
  years_of_experience JSONB, -- {'Framing': 5}
  certifications JSONB, -- [{name: 'OSHA 10', url: '...'}]
  languages JSONB, -- [{code: 'en', level: 'Native'}]
  tools_equipment TEXT,
  photo_url TEXT,
  home_zip_code VARCHAR(10) REFERENCES zip_codes(zip_code), -- FK might fail if zip_codes empty, handled in app or loose constraint? Strict FK is better but need seed data.
  -- For MVP, maybe drop FK constraint if we don't have zip db populated?
  -- We'll keep it but users must enter valid zips that exist in DB?
  -- Or we remove FK for MVP and just store string.
  -- DECISION: Remove FK for MVP to avoid "zip not found" errors during onboarding if we haven't seeded US Zips.
  -- home_zip_code VARCHAR(10) REFERENCES zip_codes(zip_code),
  max_travel_distance_miles INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
-- Re-defining home_zip_code without FK for MVP safety
ALTER TABLE worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_home_zip_code_fkey;

CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_trade ON worker_profiles(trade);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_skills ON worker_profiles USING GIN(skills);

-- 3. worker_availability
CREATE TABLE IF NOT EXISTS worker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  availability_mode VARCHAR(50) NOT NULL, -- 'Short_Term', 'Long_Term'
  start_date DATE,
  end_date DATE, 
  blocked_dates DATE[], 
  recall_notice_days INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_availability_date_range CHECK (end_date >= start_date OR end_date IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_worker_availability_worker_id ON worker_availability(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_availability_dates ON worker_availability(start_date, end_date) WHERE is_active = true;

-- 4. worker_rates
CREATE TABLE IF NOT EXISTS worker_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  overtime_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(worker_id, company_id)
);

-- 5. RLS Policies (Basic)
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON worker_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON worker_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON worker_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE worker_rates ENABLE ROW LEVEL SECURITY;
-- Admins can view/edit rates for their workers
-- For MVP, creating basic placeholder policies or just relying on service role for sensitive stuff?
-- Let's allow public read for now to simplify booking flow? No, rates are sensitive.
-- Only Borrower Company and Lender Company should see rates.
-- Complex RLS deferred; using Service Role for critical ops or simplified:
CREATE POLICY "Lenders view own worker rates" ON worker_rates FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_members WHERE user_id = auth.uid() AND company_id = worker_rates.company_id)
);
