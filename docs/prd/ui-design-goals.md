# User Interface Design Goals

## Overall UX Vision

SmartBench must provide a clean, professional B2B interface that feels trustworthy and efficient. The platform serves construction industry professionals who need quick access to critical information and actions. The UX should prioritize:

- **Speed and Efficiency:** Critical actions (booking, verification, time clock) must be accessible within 2-3 taps/clicks
- **Mobile-First:** Field workers primarily use mobile devices; supervisors may use desktop or mobile
- **Trust Indicators:** Clear display of insurance status, ratings, verification badges
- **Offline Capability:** Time clock and verification must work in low-connectivity construction sites
- **Clarity Over Complexity:** Financial information presented transparently but without overwhelming detail

## Key Interaction Paradigms

- **Magic Links:** Passwordless entry via SMS for onboarding and verification workflows
- **Deep Links:** SMS notifications open directly to relevant screens (verification card, booking details)
- **Progressive Disclosure:** Complex workflows broken into steps (onboarding wizard, booking checkout)
- **Contextual Actions:** Actions available where they're needed (verify from timesheet card, clock in from shift notification)
- **Real-Time Updates:** Live status for bookings, shifts, and financial transactions
- **Server-Side Validation:** All state transitions (booking status, worker state, etc.) are validated server-side. UI should display clear error messages when invalid transitions are attempted.

## Core Screens and Views

1. **Onboarding Flow** - Multi-step wizard for company setup, KYB verification, and first worker profile
2. **Marketplace / Search** - Worker search with filters, availability calendar, and semi-anonymous listings
3. **Worker Profile** - Detailed view with skills, ratings, certifications, availability calendar
4. **Booking Cart & Checkout** - Cart management, site contact selection, payment processing
   - **Note:** Site Contact data is retrieved from `bookings.primary_site_contact_id` field (direct FK to users table). UI must handle site contact selection during checkout. Site Contact can be any company member (not limited to Supervisor role). Verification is role-based - any Supervisor, Manager, or Admin in the Borrower Company can verify timesheets, regardless of Site Contact assignment.
5. **Time Clock** - Mobile-optimized clock in/out with GPS coordinate capture and project photo
6. **Verification Dashboard** - Supervisor view of pending timesheets with approve/dispute actions
7. **Company Dashboard** - Admin view with metrics, alerts, and quick actions
8. **Financials Dashboard** - Stripe Connected Account balance display, transaction history (from Stripe API), withdrawal interface for lenders
9. **Roster Management** - Admin view for managing workers, setting rates, listing/unlisting
10. **Settings** - Company settings, insurance upload, break/lunch policies, bank account management

## Accessibility: WCAG AA

The platform must meet WCAG AA standards to ensure accessibility for users with disabilities. This includes:
- Keyboard navigation for all interactive elements
- Screen reader compatibility
- Color contrast ratios meeting WCAG AA standards
- Alt text for images and icons
- Form labels and error messages clearly associated with inputs

## Branding

SmartBench should project a professional, trustworthy brand suitable for B2B construction industry:
- **Color Palette:** Professional blues and grays with accent colors for alerts/actions
- **Typography:** Clear, readable sans-serif fonts optimized for mobile and desktop
- **Icons:** Construction industry-appropriate iconography (tools, workers, buildings)
- **Tone:** Professional but approachable, avoiding overly corporate or casual language

## Target Device and Platforms: Web Responsive

- **Primary:** Mobile-responsive web application (PWA)
- **Devices:** Smartphones (iOS/Android browsers), Tablets, Desktop browsers
- **Offline Support:** PWA capabilities for offline time clock and verification
- **Native Apps:** Not in MVP scope, but architecture should allow for future native app development

## Notification Center

As a user,
I want a persistent in-app view of all my notifications,
so that I can find historical "Verify" or "Job Offer" deep links if I deleted the SMS.

**Requirements:**
1. Persistent in-app notification center accessible from main navigation
2. Notification center mirrors `notification_logs` table data
3. Displays all notification types: Verification requests, Job offers, Booking confirmations, System alerts
4. Each notification includes: Type, Timestamp, Message content, Deep link (if applicable)
5. Deep links remain active for 24 hours after notification creation
6. Notifications can be marked as read/unread
7. Filtering by notification type and date range
8. Search functionality to find specific notifications
9. Notifications persist even if original SMS/Email is deleted

## Connectivity Indicator

As a user,
I want a global header indicator showing my connection status,
so that I know when I'm online, offline, or syncing data.

**Requirements:**
1. Global header indicator visible on all screens
2. Three states displayed:
   - "Online" - Green indicator when connected
   - "Offline" - Red indicator when disconnected
   - "Syncing..." - Yellow/amber indicator when offline data is being synchronized
3. Indicator shows sync progress when applicable (e.g., "Syncing 3 items...")
4. Clicking indicator expands to show detailed sync status and queued operations
5. Indicator automatically updates based on network connectivity and sync state
6. Visual feedback when offline actions are queued for sync

## Gantt Roster View

As a lender admin,
I want a Gantt-style chart view for managing worker rosters and availability,
so that I can visually see and manage worker schedules across multiple days.

**Requirements:**
1. Gantt chart view available in Roster/Availability management interface
2. Chart layout: Rows = Workers, Columns = Days
3. Visual blocks show worker availability periods and booked shifts
4. Click-and-drag functionality to block/unblock availability periods
5. Color coding: Available (green), Booked (blue), Blocked (gray), Unavailable (red)
6. Supports month view with navigation to previous/next months
7. Tooltip on hover shows detailed information (dates, times, booking details)
8. Bulk operations: Select multiple workers or days for batch availability updates
9. Export capability to PDF or image format
10. Responsive design that works on desktop and tablet devices

---