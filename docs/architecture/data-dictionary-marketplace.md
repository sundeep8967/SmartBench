# Data Dictionary - Marketplace Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Data Dictionary](./data-dictionary.md)

This document contains business-focused descriptions of Marketplace domain entities, their relationships, state machines, and business rules. For technical schema definitions, SQL table structures, constraints, and indexes, see [schema.md](schema.md).

---

## Marketplace Domain

### Worker Availability

Worker availability date ranges and blocked dates. Defines when workers are available for booking.

**Key Attributes:**
- Worker and Company references
- Availability mode (Short_Term or Long_Term)
- Start and end dates
- Blocked dates array
- Recall notice days (for long-term)

**Business Rules:**
- Only Users with Admin, Manager (Lender context), or Supervisor role can set worker availability
- System automatically locks dates when booked
- Long-term availability can be indefinite (end_date = NULL)

### Cart Item

Cart items for booking checkout. Simple selection list with no reservation power. Final availability check at checkout prevents double-booking.

**Key Attributes:**
- Borrower Company and Worker references
- Start and end dates

**Business Rules:**
- Workers remain visible in search results until booking is confirmed
- Cart has no reservation power - multiple users can add the same worker to their carts
- Final availability check occurs at checkout (immediately before payment) using database-level locking
- First user to complete payment wins; second user receives error

### Saved Search

Saved search criteria with alert preferences. Enables borrowers to be notified when matching workers become available.

**Key Attributes:**
- Borrower Company reference
- Search criteria
- Alert preference (Daily_Digest or Instant)
- Timezone
- Last checked timestamp

**Business Rules:**
- Daily digest runs at 05:00 AM (User's Local Time)
- Instant alerts sent immediately when matching worker becomes available
- **Real-Time Matching:** Saved search alerts use the same real-time database queries as the main search engine, ensuring alerts reflect current worker availability with no sync delay

### Zip Code

Zip code coordinate storage for geo-availability calculations. Enables distance-based worker search.

**Key Attributes:**
- Zip code (primary key)
- Latitude and longitude coordinates
- City and state

**Note:** Worker profiles should reference zip codes for home location and define maximum travel distance.

### Worker Profile

Worker profile information including skills, experience, certifications, and geographic preferences. One profile per user, used for marketplace search and worker listing.

**Key Attributes:**
- User reference (one-to-one relationship)
- Trade and hierarchical skills
- Years of experience per skill
- Certifications (with optional document uploads)
- Languages with proficiency levels
- Tools & Equipment (free-form text description for MVP)
- Photo URL
- Home zip code and maximum travel distance (miles)

**Business Rules:**
- **Travel Radius at Worker Level:** Workers often live far from their company office. Home zip code and maximum travel distance are set at the Worker level, not the Company level. This allows workers to define their own travel radius based on their personal location.
- **Tools & Equipment Simplification:** For MVP, Tools & Equipment is a simple free-form text description field, not a complex checklist. This reduces complexity while still allowing workers to describe what they bring to job sites.
- **Worker Rates:** Hourly rates and overtime rates are stored in the `worker_rates` table (not in worker_profiles). Each worker can have different rates at different companies. Rates include `hourly_rate` (standard rate) and `overtime_rate` (custom dollar amount for OT, nullable). See [Schema: Marketplace Domain](./schema-marketplace.md#worker_rates) for complete table definition.
- One profile per user (enforced by UNIQUE constraint on user_id)

**Usage:**
- Worker profiles are used in marketplace search to match workers with borrower requirements
- **Real-Time Search:** Marketplace search queries the database directly in real-time - worker availability and profile updates are immediately reflected in search results with no sync delay
- Travel radius (home_zip_code + max_travel_distance_miles) determines which workers appear in distance-based searches
- Skills, experience, and certifications are searchable and filterable in marketplace
- Tools & Equipment description is displayed to borrowers but not searchable (text field)

---

**Back to:** [Data Dictionary](./data-dictionary.md)
