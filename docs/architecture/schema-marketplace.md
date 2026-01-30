# Database Schema - Marketplace Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Marketplace domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Marketplace Domain](./data-dictionary-marketplace.md).**

---

## Marketplace Domain

### worker_availability

```sql
CREATE TABLE worker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  availability_mode VARCHAR(50) NOT NULL, -- ENUM: 'Short_Term', 'Long_Term'
  start_date DATE,
  end_date DATE, -- NULL for long-term indefinite
  blocked_dates DATE[], -- Array of specific blocked dates
  recall_notice_days INTEGER DEFAULT 3, -- For long-term (business days)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_availability_date_range CHECK (end_date >= start_date OR end_date IS NULL)
);

CREATE INDEX idx_worker_availability_worker_id ON worker_availability(worker_id);
CREATE INDEX idx_worker_availability_dates ON worker_availability(start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_worker_availability_company_id ON worker_availability(company_id);
```

**Technical Constraints:**
- `availability_mode` ENUM: 'Short_Term', 'Long_Term'
- `end_date >= start_date OR end_date IS NULL` - Enforced at database level with CHECK constraint (Row-Local Truth: `CONSTRAINT valid_availability_date_range CHECK (end_date >= start_date OR end_date IS NULL)`)
  - NULL `end_date` represents indefinite long-term availability

**Important Note on `blocked_dates`:**
- **UI Display Only:** The `blocked_dates` field is used for UI display and availability management interface only. It allows lenders to manually block specific dates for workers (e.g., holidays, personal time off).
- **Not Used in Search:** Worker search queries use **real-time `NOT EXISTS` checks** against the `bookings` table to determine availability. Search does NOT rely on `blocked_dates` - it queries bookings directly for real-time accuracy. This ensures workers become available immediately when bookings are cancelled (no sync delay).
- **Search Availability:** Search availability is determined by checking the `bookings` table for conflicting bookings in blocking statuses (`Confirmed`, `Active`, `Pending_Payment`, `Payment_Paused_Dispute`, `Suspended_Insurance`). The `blocked_dates` field is not used in search filtering.

### cart_items

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cart_items_borrower ON cart_items(borrower_company_id);
CREATE INDEX idx_cart_items_worker ON cart_items(worker_id);
```

**Cart Synchronization Behavior:**
- **Server-Side Authority:** Cart state is server-side authoritative. All cart operations (add, remove, update) are processed on the server, and the server's cart state (stored in this table) is the single source of truth.
- **Conflict Resolution:** Last-write-wins for conflicts. The most recent server-side operation (by `created_at` timestamp) determines the final cart state. Concurrent operations from multiple devices are serialized by database transactions.
- **Device Synchronization:** When a user logs in from a new device, the cart is loaded from this table (not merged with any local state). The server's cart state is authoritative, and any local cart state on the new device is replaced with the server state.
- **Atomic Operations:** Cart operations (add/remove) are atomic server-side operations. Each add or remove operation is processed as a single database transaction, ensuring cart consistency.

**Business Rules:**
- Cart items are linked to `borrower_company_id` (each company context maintains its own independent cart)
- Cart is a simple selection list with no reservation power - workers remain visible in search results even when in carts
- Cart items are automatically deleted when booking is created

### saved_searches

```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  search_criteria JSONB NOT NULL, -- Stores all filter criteria
  alert_preference VARCHAR(50) NOT NULL DEFAULT 'Daily_Digest', -- ENUM: 'Daily_Digest' | 'Instant'
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Chicago', -- User's timezone
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_borrower ON saved_searches(borrower_company_id);
CREATE INDEX idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX idx_saved_searches_alert_preference ON saved_searches(alert_preference);
```

**Technical Constraints:**
- `alert_preference` ENUM: 'Daily_Digest', 'Instant'

### zip_codes

```sql
CREATE TABLE zip_codes (
  zip_code VARCHAR(10) PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zip_codes_coordinates ON zip_codes(latitude, longitude);
```

### worker_profiles

```sql
CREATE TABLE worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade VARCHAR(100),
  skills JSONB, -- Hierarchical skills structure
  years_of_experience JSONB, -- Years of experience per skill
  certifications JSONB, -- Array of certification objects with name and optional document_url
  languages JSONB, -- Array of language objects with language code and proficiency level
  tools_equipment TEXT, -- Free-form text description (simplified for MVP)
  photo_url TEXT,
  home_zip_code VARCHAR(10) REFERENCES zip_codes(zip_code),
  max_travel_distance_miles INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_home_zip_code ON worker_profiles(home_zip_code);
CREATE INDEX idx_worker_profiles_trade ON worker_profiles(trade);
CREATE INDEX idx_worker_profiles_skills ON worker_profiles USING GIN(skills);
```

**Technical Constraints:**
- `user_id` must be UNIQUE (one profile per user)
- `home_zip_code` references `zip_codes(zip_code)` for geo-availability calculations
- `tools_equipment` is free-form TEXT field (simplified for MVP, not structured checklist)
- `skills`, `years_of_experience`, `certifications`, and `languages` stored as JSONB for flexibility

**Business Rules:**
- Travel radius (home_zip_code, max_travel_distance_miles) is set at Worker level, not Company level
- Workers often live far from their company office, so travel radius is worker-specific
- Tools & Equipment is a simple text description field for MVP to avoid complexity

### worker_rates

```sql
CREATE TABLE worker_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL, -- Standard hourly rate
  overtime_rate DECIMAL(10,2), -- Custom OT rate (nullable, required if company.ot_rate_type = 'Custom_Rate')
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(worker_id, company_id)
);

CREATE INDEX idx_worker_rates_worker_id ON worker_rates(worker_id);
CREATE INDEX idx_worker_rates_company_id ON worker_rates(company_id);
```

**Technical Constraints:**
- `(worker_id, company_id)` must be UNIQUE (one rate record per worker-company pair)
- `overtime_rate` is nullable but required when company has `ot_rate_type = 'Custom_Rate'` (enforced at application level)
- Both rates stored as DECIMAL(10,2) for precision

**Business Rules:**
- Worker rates are company-specific (same worker can have different rates at different companies)
- `hourly_rate` is the standard rate used for normal hours
- `overtime_rate` is the custom dollar amount used when OT rules are met (from `bookings.ot_terms_snapshot`). **Critical:** The system does NOT use a 1.5x multiplier or any platform-calculated multiplier. `overtime_rate` is a specific dollar amount (e.g., $52.50) configured by lenders, not a calculated percentage of the hourly rate.
- If `company.ot_rate_type = 'No_OT'`, `overtime_rate` is not used regardless of value

---

**Back to:** [Database Schema](./schema.md)
