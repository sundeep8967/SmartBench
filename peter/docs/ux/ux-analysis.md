# UX Analysis: SmartBench Platform

**Created by:** Sally (UX Expert)  
**Date:** January 2026  
**Purpose:** Comprehensive UX analysis of user personas, goals, pain points, and key user flows to inform navigation structure and front-end design.

---

## 1. User Personas & Goals

### Persona 1: Borrower (Company Admin/Supervisor)

**Who:** Company admin or supervisor who needs to find and book workers for construction projects.

**Primary Goals:**
- Find qualified workers quickly when needed
- Ensure workers are available when needed
- Compare options without revealing company identity (prevent poaching)
- Book multiple workers efficiently in one transaction
- Verify worker hours accurately and quickly
- Track project-level progress across multiple bookings
- Manage financial operations transparently

**Secondary Goals:**
- Save successful searches for future use
- Review booking history
- Audit lender insurance during checkout

**Context:**
- Operates in time-sensitive construction environment
- Needs mobile access for on-site verification
- May use desktop for planning and booking
- Values speed and efficiency over detailed exploration

---

### Persona 2: Lender (Company Admin)

**Who:** Company admin who wants to monetize idle workers by listing them in the marketplace.

**Primary Goals:**
- Onboard company quickly and securely
- Efficiently manage worker roster and profiles
- Set competitive lending rates
- Control worker listing status
- Manage insurance compliance automatically
- Prevent double-booking through availability management
- Receive fast payouts upon verification
- Track financial operations clearly

**Secondary Goals:**
- Withdraw funds quickly (T+2 or instant)
- Monitor worker attendance and booking status
- Set availability patterns efficiently

**Context:**
- Manages multiple workers simultaneously
- Needs to balance operational efficiency with compliance
- Values financial flexibility and transparency
- May operate as both Lender and Borrower (dual marketplace)

---

### Persona 3: Worker

**Who:** Individual construction worker who works shifts booked through the platform.

**Primary Goals:**
- Complete profile quickly and easily (mobile-friendly)
- Understand listing status and requirements
- Receive clear shift information and reminders
- Clock in/out easily with offline support
- Track time accurately (breaks, lunch, travel)
- Understand payment status

**Secondary Goals:**
- View shift history
- Rate supervisors and companies
- Self-correct time entries before submission

**Context:**
- Primarily mobile users (on job sites)
- May work in areas with poor connectivity
- Needs simple, fast interactions
- Values clarity and reliability

---

### Persona 4: Supervisor

**Who:** User responsible for verifying worker hours on job sites. All supervisors must be company members.

**Primary Goals:**
- Verify hours quickly via SMS magic link
- View timesheet details (system time, GPS data, photos)
- Approve or dispute timesheets efficiently
- Reject workers during trial period if needed
- Rate workers after shift completion

**Context:**
- All supervisors are company members with full company member access
- Needs mobile access for on-site verification
- Values speed and simplicity

---

### Persona 5: Solopreneur

**Who:** One-person company holding all three roles (Admin, Supervisor, Worker) simultaneously.

**Primary Goals:**
- Manage all company functions from single interface
- List themselves in marketplace
- Book other workers when needed
- Verify their own hours (if they book themselves)
- Access all features without role switching

**Context:**
- Common in construction industry
- Needs unified experience without role confusion
- Values simplicity and efficiency

---

## 2. Pain Points Addressed

### Security & Trust
- **Problem:** Trust between unknown companies
- **Solution:** Insurance verification, Stripe escrow/hold protection (funds held via Stripe during disputes), verification workflows, ratings system
- **UX Implication:** Clear trust indicators (insurance badges, ratings, verification status) must be visible throughout the platform

### Payment Security
- **Problem:** Payment terms and disputes
- **Solution:** Upfront payment, Stripe escrow/hold (funds held via Stripe API during disputes), automatic fund release, dispute resolution
- **UX Implication:** Transparent financial information, clear escrow status, easy dispute access

### Operational Efficiency
- **Problem:** Manual coordination and verification reduce **operational efficiency**
- **Solution:** Automated notifications, magic link verification, offline time tracking, automatic payments
- **UX Implication:** Minimize manual steps, provide clear status updates, support offline workflows

### Financial Flexibility
- **Problem:** Cash flow management requires **financial flexibility**
- **Solution:** Direct Stripe payments, daily payouts, T+2 or instant withdrawals
- **UX Implication:** Transparent payment processing, clear withdrawal options, real-time payment status

### Time-Sensitive Operations
- **Problem:** Construction projects require quick worker access for **time-sensitive operations**
- **Solution:** Fast search, availability management, optimistic concurrency at checkout
- **UX Implication:** Critical actions (booking, verification) must be 2-3 clicks away

### Mobile-First Needs
- **Problem:** Field workers primarily use mobile devices
- **Solution:** PWA with offline support, mobile-optimized time clock
- **UX Implication:** Mobile-first design, touch-friendly interactions, offline capability

---

## 3. Key User Flows

### Flow 1: Borrower - Search & Book Workers

**Goal:** Find and book workers for a construction project

**Steps:**
1. **Entry:** Borrower needs workers for a project
2. **Search:** Search workers by trade, skills, location, availability
3. **Filter:** Filter by rating, experience, certifications
4. **Review:** View worker profiles (company name hidden initially)
5. **Select:** Add workers to cart (company name revealed after cart addition)
6. **Review Cart:** Review cart with total costs
7. **Assign Supervisor:** Assign supervisor for verification (must be company member)
8. **Checkout:** Proceed to checkout
9. **Payment:** System charges the full booking total (Worker Rate + Service Fee) to the user's credit card via Stripe. See [Epic 6: Story 6.2](../prd/epic-6.md#story-62-payment-processing-service-fee) for complete payment processing logic.
10. **Confirm:** Confirm booking
11. **Project Link:** Optionally link booking to existing project or create new project

**Critical Touchpoints:**
- Search results must load quickly
- Cart must persist across sessions (no locking - workers remain visible until booking confirmed)
- Checkout must be clear and secure
- Payment breakdown must clearly show Worker Rate and Service Fee (30%)

**Navigation Requirements:**
- Primary: Marketplace/Search (top-level navigation)
- Secondary: Cart icon (persistent)
- Contextual: Project selection during checkout

---

### Flow 2: Borrower - Verify Hours & Release Payment

**Goal:** Verify worker hours and release payment

**Steps:**
1. **Notification:** Receive notification when worker clocks in
2. **Notification:** Receive notification when timesheet ready for review
3. **Verify:** Verify hours via SMS magic link (deep link to verification card)
4. **Review:** View timesheet details (system time, GPS data, photos)
5. **Approve/Dispute:** Approve or dispute timesheet
6. **Auto-Release:** Funds automatically released upon verification (or 4 hours after clock-out auto-approval)

**Critical Touchpoints:**
- SMS magic link must work reliably
- Deep link must open directly to verification card
- Timesheet details must be clear and accessible
- Approval/dispute actions must be obvious

**Navigation Requirements:**
- Primary: Verification Dashboard (for supervisors)
- Secondary: Notifications (SMS deep links)
- Contextual: Booking details page

---

### Flow 3: Lender - Onboard Company & List Workers

**Goal:** Set up company and list workers in marketplace

**Steps:**
1. **Onboard:** Complete multi-step onboarding wizard
   - Company info (EIN, business name, address)
   - KYB verification (Stripe Identity)
   - Choose: Solopreneur or Company with employees
2. **Invite Workers:** Invite workers via bulk roster invite (SMS magic links)
3. **Worker Profiles:** Workers complete profiles (trade, skills, experience, photo)
4. **Review:** Admin reviews profiles in roster
5. **Set Rate:** Admin sets lending rate ($/hr)
6. **List:** Admin toggles "List in Marketplace" to ON
7. **Insurance:** Upload insurance policies (General Liability, Workers' Compensation)
8. **Availability:** Set availability date ranges and block dates

**Critical Touchpoints:**
- Onboarding wizard must be clear and progressable
- Bulk invite must be simple
- Roster management must be efficient
- Listing toggle must be obvious

**Navigation Requirements:**
- Primary: Roster Management (for admins)
- Secondary: Settings (insurance, availability)
- Contextual: Worker profile edit

---

### Flow 4: Lender - Manage Bookings & Receive Payment

**Goal:** Manage bookings and receive payments

**Steps:**
1. **Notification:** Receive notification when booking request received (payment processed to Stripe Connect)
2. **Review:** Review booking details
3. **Monitor:** Monitor worker clock-in/out status
4. **Payment:** Funds are processed directly through Stripe upon verification
5. **View Payment History:** View payment history through Stripe dashboard integration
7. **Withdraw:** Withdraw funds to bank account (T+2 days or instant with fee)

**Critical Touchpoints:**
- Booking notifications must be clear
- Stripe balance must be prominent
- Withdrawal options must be accessible
- Transaction history must be searchable

**Navigation Requirements:**
- Primary: Company Dashboard (bookings, financials)
- Secondary: Financials
- Contextual: Booking details page

---

### Flow 5: Worker - Onboard & Complete Profile

**Goal:** Complete profile and get listed in marketplace

**Steps:**
1. **Invitation:** Receive SMS magic link invitation
2. **Click Link:** Click SMS link
3. **Create Password:** Create password
4. **Accept Terms:** Accept terms and conditions
5. **Complete Profile:** Add Trade, Skills, Experience, Photo, Certifications
6. **Submit:** Submit profile for admin review
7. **Wait:** Wait for admin review
8. **Listed:** Worker appears in marketplace search (when admin toggles listing ON)

**Critical Touchpoints:**
- SMS link must work reliably
- Profile creation must be mobile-friendly
- Status visibility must be clear (pending, approved, listed)

**Navigation Requirements:**
- Primary: Profile/Onboarding (for new workers)
- Secondary: Status indicators
- Contextual: Help/guidance during onboarding

---

### Flow 6: Worker - Work Shift & Track Time

**Goal:** Complete shift and track time accurately

**Steps:**
1. **Notification:** Receive notification when booked (shift assigned)
2. **View Details:** View shift details (date, time, location, supervisor contact)
3. **Reminder:** Receive 12-hour reminder before shift
4. **Confirmation:** Receive 1-hour confirmation with deep link
5. **Clock In:** Clock in with GPS coordinate capture and photo
6. **Log Breaks:** Log breaks/lunch as required
7. **Log Travel:** Log travel time if applicable
8. **Clock Out:** Clock out
9. **Timesheet:** Timesheet sent to supervisor for verification
10. **Notification:** Receive notification when hours verified

**Critical Touchpoints:**
- Shift notifications must be clear and actionable
- Deep links must open directly to time clock
- Clock in/out must work offline
- Break/lunch logging must be simple

**Navigation Requirements:**
- Primary: Time Clock (mobile-optimized)
- Secondary: My Shifts/Bookings
- Contextual: Notifications (SMS deep links)

---

### Flow 7: Supervisor - Verify Timesheet

**Goal:** Verify worker hours quickly and accurately

**Steps:**
1. **Notification:** Receive SMS notification when worker clocks out
2. **Magic Link:** Click SMS magic link (deep link to verification card)
3. **View Timesheet:** View timesheet details (system time, submitted time, GPS data, photos)
4. **Review:** Review for accuracy and anomalies
5. **Approve/Dispute:** Approve or dispute timesheet
6. **Rate:** Optionally rate worker after shift completion
7. **Auto-Approval:** If not verified within 2 hours, Borrower Admin is alerted (auto-approval 4 hours after clock-out)

**Critical Touchpoints:**
- SMS magic link must work reliably
- Deep link must open directly to verification card
- Timesheet details must be comprehensive but clear
- Approve/dispute actions must be obvious

**Navigation Requirements:**
- Primary: Verification Dashboard (for supervisors)
- Secondary: Notifications (SMS deep links)
- Contextual: Booking details page

---

## 4. Cross-Persona Interactions

### Borrower ↔ Lender
- Borrower searches → Lender's workers appear in results
- Borrower books → Lender receives booking request
- Borrower verifies hours → Lender receives funds

**UX Implication:** Both personas need visibility into booking status and financial transactions

### Lender ↔ Worker
- Lender invites → Worker receives SMS
- Lender lists worker → Worker appears in marketplace
- Lender receives payment → Worker paid by lender company

**UX Implication:** Lender needs roster management, worker needs profile visibility

### Borrower ↔ Worker
- Borrower books → Worker receives shift assignment
- Worker clocks in → Borrower receives notification
- Worker completes shift → Borrower verifies hours

**UX Implication:** Both need clear communication channels and status updates

---

## 5. Critical Design Constraints

### Mobile-First
- Field workers primarily use mobile devices
- Supervisors may use mobile for on-site verification
- All critical actions must be mobile-optimized

### Offline Support
- Time clock must work offline
- Verification must work with low connectivity
- Data sync must be transparent

### Speed Requirements
- Critical actions (booking, verification) must be 2-3 clicks away
- Search results must load quickly
- Payment processing must be clear and fast

### Trust Indicators
- Insurance status must be visible
- Ratings must be prominent
- Verification badges must be clear

### Financial Transparency
- Stripe balance must be prominent
- Transaction history must be accessible
- Payment status must be clear

---

## 6. Navigation Structure Implications

Based on this analysis, the navigation structure must support:

1. **Role-Based Navigation:** Different primary navigation for Borrower, Lender, Worker, Supervisor
2. **Context Switching:** Support for users who are both Borrower and Lender
3. **Quick Actions:** Critical actions (booking, verification, time clock) must be easily accessible
4. **Status Visibility:** Clear indicators for booking status, worker status, payment status
5. **Mobile Optimization:** Mobile-first navigation patterns (hamburger menu, bottom navigation)
6. **Progressive Disclosure:** Complex workflows broken into steps (onboarding, checkout)

---

## Next Steps

This analysis will inform:
1. **Information Architecture:** Organizing features into logical navigation structure
2. **Navigation Design:** Primary, secondary, and contextual navigation patterns
3. **Front-End Specification:** Detailed wireframes and interaction patterns
4. **Component Design:** Reusable UI components for common patterns

---

## Related Documentation

This section provides links to **related documentation** that complements this UX analysis.

- [Customer Journey](../prd/customer-journey.md) - Detailed journey maps
- [User Roles and Actors](../prd/user-roles-and-actors.md) - Role definitions
- [Feature Blueprint](../prd/feature-blueprint.md) - Feature overview
- [UI Design Goals](../prd/ui-design-goals.md) - Design principles
