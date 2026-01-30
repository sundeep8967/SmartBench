# Information Architecture & Navigation Structure

**Created by:** Sally (UX Expert)  
**Date:** January 2026  
**Purpose:** Complete information architecture and navigation structure for SmartBench platform using sidebar navigation pattern optimized for mobile-friendly web apps.

---

## Navigation Pattern: Sidebar Navigation

**Pattern:** Collapsible sidebar navigation that adapts to screen size:
- **Desktop:** Persistent sidebar (240-280px width) with full labels
- **Tablet:** Collapsible sidebar (icon-only when collapsed, 64px width)
- **Mobile:** Overlay sidebar (slides in from left, full width when open, hidden when closed)

**Benefits:**
- Consistent navigation across all screen sizes
- Efficient use of screen space
- Familiar pattern for B2B web applications
- Easy role-based customization
- Supports quick context switching

---

## Information Architecture Overview

The SmartBench platform organizes features into **role-based navigation sections** that adapt based on the user's active company context and assigned roles.

### Navigation Hierarchy

```
Sidebar Navigation
├── Sidebar Header
│   ├── Current Company Name (read-only, from login-time resolution)
│   ├── Notifications
│   └── User Profile
├── Primary Navigation (role-based sections)
│   ├── Dashboard
│   ├── Marketplace (Borrower role)
│   ├── Roster (Lender role)
│   ├── Bookings
│   ├── Time Clock (Worker role)
│   ├── Verification (Supervisor role)
│   ├── Financials
│   └── Projects
├── Secondary Navigation (contextual sections)
│   ├── Saved Searches
│   ├── Notifications
│   └── Settings
└── User Profile & Logout
```

**Note:** Company context is determined at login time (login-time resolution). The sidebar header displays the current company name as read-only information. There is no company switcher UI component. To switch companies, users must log out and log back in.

---

## Role-Based Navigation Structure

### Navigation Sections by Role

The sidebar displays different sections based on the user's roles in their active company context. Users with multiple roles see all relevant sections.

#### Borrower Role Navigation

**Primary Sections:**
1. **Dashboard** - Overview of bookings, projects, recent activity
2. **Marketplace** - Search workers, view results, manage cart
3. **Bookings** - View all bookings, booking details, booking history
4. **Projects** - Create/manage projects, link bookings to projects
5. **Verification** - Verify timesheets (if also Supervisor role)
6. **Financials** - View payment history, manage Stripe account

**Secondary Sections:**
- **Saved Searches** - Manage saved searches and alerts
- **Notifications** - View notifications and alerts
- **Settings** - Company settings, insurance, break/lunch policies

---

#### Lender Role Navigation

**Primary Sections:**
1. **Dashboard** - Overview of bookings, Stripe balance, worker status, recent activity
2. **Roster** - Manage workers, set rates, toggle listing status
3. **Bookings** - View all bookings, booking details, booking history
4. **Financials** - View Stripe balance, transaction history, withdrawals
5. **Settings** - Company settings, insurance upload, availability management

**Secondary Sections:**
- **Notifications** - View notifications and alerts
- **Settings** - Company settings, insurance, availability patterns

---

#### Worker Role Navigation

**Primary Sections:**
1. **Dashboard** - Overview of upcoming shifts, shift history, profile status
2. **Time Clock** - Clock in/out, view active shift, log breaks/travel
3. **My Shifts** - View all assigned shifts, shift details, timesheet status
4. **Profile** - Edit profile, view listing status, certifications

**Secondary Sections:**
- **Notifications** - View shift notifications and reminders
- **Settings** - Personal settings, preferences

---

#### Supervisor Role Navigation

**Primary Sections:**
1. **Dashboard** - Overview of pending verifications, recent activity
2. **Verification** - View pending timesheets, verify hours, approve/dispute
3. **Bookings** - View assigned bookings, booking details (if internal supervisor)

**Secondary Sections:**
- **Notifications** - View verification notifications
- **Settings** - Personal settings

---

#### Solopreneur Navigation

**Primary Sections:**
1. **Dashboard** - Unified overview of all activities
2. **Marketplace** - Search workers (Borrower function)
3. **Roster** - Manage own profile, set rate, toggle listing (Lender function)
4. **Time Clock** - Clock in/out for own shifts (Worker function)
5. **Bookings** - View all bookings (both Borrower and Lender)
6. **Verification** - Verify hours (Supervisor function)
7. **Financials** - View Stripe balance, transactions, withdrawals
8. **Projects** - Create/manage projects

**Note:** Solopreneurs see all sections without role switching, providing unified access to all features.

---

## Detailed Navigation Structure

### 1. Dashboard

**Purpose:** Central hub showing overview of user's activities and key metrics

**Content by Role:**

**Borrower Dashboard:**
- Active bookings count
- Pending verifications count
- Revenue/Spend summary (prominent)
- Recent bookings (last 5)
- Upcoming shifts requiring verification
- Quick actions: "Search Workers", "Create Project", "View Financials"

**Lender Dashboard:**
- Active bookings count
- Listed workers count
- Revenue summary (prominent)
- Recent bookings (last 5)
- Workers requiring attention (profile incomplete, insurance expiring)
- Quick actions: "Manage Roster", "View Financials", "Upload Insurance"

**Worker Dashboard:**
- Upcoming shifts (next 7 days)
- Active shift (if currently clocked in)
- Profile completion status
- Listing status (Listed/Not Listed)
- Recent shift history (last 5)
- Quick actions: "Clock In/Out", "Edit Profile"

**Supervisor Dashboard:**
- Pending verifications count
- Recent verifications (last 5)
- Upcoming shifts to verify
- Quick actions: "View Pending Verifications"

**Route:** `/dashboard`

---

### 2. Marketplace (Borrower Role)

**Purpose:** Search and book workers

**Navigation Structure:**
```
Marketplace
├── Search Workers (default view)
│   ├── Search bar
│   ├── Filters (trade, skills, location, availability, ratings)
│   ├── Results list
│   └── Worker profile cards
├── Worker Profile
│   ├── Worker details
│   ├── Availability calendar
│   ├── Ratings & reviews
│   └── "Add to Cart" button
├── Cart
│   ├── Cart items
│   ├── Total cost
│   └── "Proceed to Checkout" button
└── Saved Searches
    ├── Saved search list
    └── Search alerts settings
```

**Routes:**
- `/marketplace` - Search view (default)
- `/marketplace/worker/[id]` - Worker profile
- `/marketplace/cart` - Cart view
- `/marketplace/saved-searches` - Saved searches

**Quick Actions:**
- Cart icon in sidebar (shows item count badge)
- "Search Workers" button in dashboard

---

### 3. Roster (Lender Role)

**Purpose:** Manage workers, set rates, control listing status

**Navigation Structure:**
```
Roster
├── Worker List (default view)
│   ├── Worker cards with status
│   ├── Filter by status (Listed, Not Listed, Pending Profile)
│   └── Bulk actions
├── Worker Detail
│   ├── Profile information
│   ├── Lending rate
│   ├── Listing toggle
│   ├── Availability settings
│   └── Insurance status
├── Invite Workers
│   ├── Bulk invite form
│   └── Invite history
└── Insurance Management
    ├── Policy list
    ├── Upload policy
    └── Expiration warnings
```

**Routes:**
- `/roster` - Worker list (default)
- `/roster/worker/[id]` - Worker detail
- `/roster/invite` - Invite workers
- `/roster/insurance` - Insurance management

**Quick Actions:**
- "Invite Workers" button in roster list
- "Upload Insurance" button in dashboard

---

### 4. Bookings

**Purpose:** View and manage all bookings

**Navigation Structure:**
```
Bookings
├── Booking List (default view)
│   ├── Filter by status (Active, Pending, Completed, Cancelled)
│   ├── Filter by role (As Borrower, As Lender)
│   ├── Booking cards with status
│   └── Search bookings
├── Booking Detail
│   ├── Booking information
│   ├── Worker details
│   ├── Shift schedule
│   ├── Payment status
│   ├── Timesheet status
│   └── Actions (Cancel, Recall, etc.)
└── Booking History
    └── Completed/cancelled bookings
```

**Routes:**
- `/bookings` - Booking list (default)
- `/bookings/[id]` - Booking detail
- `/bookings/history` - Booking history

**Contextual Actions:**
- Borrower: Cancel booking, Assign supervisor, Verify hours
- Lender: View booking, Monitor worker status
- Worker: View shift details, Clock in/out

---

### 5. Time Clock (Worker Role)

**Purpose:** Clock in/out and track time

**Navigation Structure:**
```
Time Clock
├── Active Shift (if clocked in)
│   ├── Current shift details
│   ├── Clock out button
│   ├── Log break/lunch
│   ├── Log travel time
│   └── Timesheet preview
├── Upcoming Shifts
│   ├── Next shift details
│   ├── Clock in button (when available)
│   └── Shift reminders
└── Timesheet History
    ├── Past timesheets
    └── Verification status
```

**Routes:**
- `/time-clock` - Time clock view (default)
- `/time-clock/shift/[id]` - Shift detail
- `/time-clock/history` - Timesheet history

**Quick Actions:**
- "Clock In/Out" button prominently displayed
- Deep link from SMS notifications

---

### 6. Verification (Supervisor Role)

**Purpose:** Verify worker hours

**Navigation Structure:**
```
Verification
├── Pending Verifications (default view)
│   ├── Timesheet cards requiring verification
│   ├── Filter by urgency
│   └── Search timesheets
├── Timesheet Detail
│   ├── Timesheet information
│   ├── GPS data
│   ├── Photos
│   ├── System time vs. submitted time
│   ├── Approve button
│   └── Dispute button
└── Verification History
    └── Past verifications
```

**Routes:**
- `/verification` - Pending verifications (default)
- `/verification/timesheet/[id]` - Timesheet detail
- `/verification/history` - Verification history

**Quick Actions:**
- Deep link from SMS magic links
- "Pending Verifications" count badge in sidebar

---

### 7. Financials

**Purpose:** Manage financial operations

**Navigation Structure:**
```
Financials
├── Balance Overview (default view)
│   ├── Available Stripe balance (prominent)
│   ├── Disputed funds (Stripe escrow/hold)
│   ├── Recent transactions
│   └── Quick actions
├── Transactions
│   ├── Transaction list
│   ├── Filter by type
│   ├── Search transactions
│   └── Export transactions
├── Withdrawals
│   ├── Withdrawal history
│   ├── Request withdrawal
│   └── Withdrawal options (T+2 or instant)
└── Financial Reports
    ├── Revenue reports
    └── Expense reports
```

**Routes:**
- `/financials` - Balance overview (default)
- `/financials/transactions` - Transaction list
- `/financials/withdrawals` - Withdrawals
- `/financials/reports` - Financial reports

**Quick Actions:**
- Stripe balance displayed in sidebar header
- "View Financials" button in dashboard

---

### 8. Projects (Borrower Role)

**Purpose:** Create and manage projects

**Navigation Structure:**
```
Projects
├── Project List (default view)
│   ├── Project cards
│   ├── Create project button
│   └── Filter projects
├── Project Detail
│   ├── Project information
│   ├── Linked bookings
│   ├── Project timeline
│   └── Project metrics
└── Create Project
    └── Project creation form
```

**Routes:**
- `/projects` - Project list (default)
- `/projects/[id]` - Project detail
- `/projects/create` - Create project

**Contextual Actions:**
- Link booking to project during checkout
- Create project from booking detail page

---

## Secondary Navigation Sections

### Saved Searches (Borrower Role)

**Purpose:** Manage saved searches and alerts

**Route:** `/saved-searches`

**Content:**
- List of saved searches
- Edit search criteria
- Manage alerts (daily digest, instant notifications)
- Delete saved searches

---

### Notifications

**Purpose:** View all notifications and alerts

**Route:** `/notifications`

**Content:**
- Notification list (grouped by type)
- Filter by type (Booking, Verification, Payment, etc.)
- Mark as read/unread
- Notification settings

**Quick Access:**
- Notification bell icon in sidebar header (shows unread count badge)
- Deep links from SMS notifications

---

### Settings

**Purpose:** Manage account and company settings

**Navigation Structure:**
```
Settings
├── Company Settings (Admin role)
│   ├── Company information
│   ├── Insurance management
│   ├── Break/lunch policies
│   ├── Availability defaults
│   └── Bank account (Stripe Connect)
├── Profile Settings
│   ├── Personal information
│   ├── Password
│   ├── WebAuthn/Biometrics
│   └── Notification preferences
└── Account Settings
    ├── Company membership
    └── Logout
```

**Routes:**
- `/settings` - Settings overview
- `/settings/company` - Company settings
- `/settings/profile` - Profile settings
- `/settings/account` - Account settings

---

## Sidebar Header

**Components:**
1. **Current Company Display** (read-only)
   - Shows current company name (from login-time resolution)
   - Displays user's roles in current company
   - Note: Company context is determined at login time. To switch companies, user must log out and log back in.

2. **Notification Bell** (always visible)
   - Unread count badge
   - Click to open notifications

3. **User Profile Menu**
   - User avatar/initials
   - Dropdown: Profile, Settings, Logout

---

## Mobile Navigation Behavior

### Sidebar States

**Closed State (Default on Mobile):**
- Sidebar hidden off-screen
- Hamburger menu icon in top-left
- Clicking hamburger opens sidebar overlay

**Open State:**
- Sidebar slides in from left (full width overlay)
- Backdrop overlay (semi-transparent)
- Close button (X) in top-right of sidebar
- Clicking backdrop closes sidebar

**Desktop State:**
- Sidebar always visible (persistent)
- Collapse/expand toggle button
- Icon-only mode when collapsed (64px width)
- Full labels when expanded (240-280px width)

---

## Quick Actions & Floating Elements

### Persistent Quick Actions

**Cart Icon** (Borrower role)
- Location: Sidebar header or floating button
- Shows item count badge
- Click to open cart
- Always accessible

**Clock In/Out Button** (Worker role)
- Location: Floating action button (bottom-right on mobile)
- Always accessible when worker has active/upcoming shift
- Prominent, touch-friendly size

**Pending Verifications Badge** (Supervisor role)
- Location: Verification section in sidebar
- Shows count of pending verifications
- Red badge for urgent items (>2 hours old)

---

## Company Context (Login-Time Resolution)

### Multi-Company Users

**Login-Time Resolution:**
- Company context is determined automatically at login time
- If user has single active membership: Logged directly into that company
- If user has multiple active memberships: "Select Company" screen shown once after login
- **No Hot-Swapping:** The global header company switcher has been removed. To switch companies, users must log out and log back in.

**Current Company Display:**
- Sidebar header shows current company name (read-only)
- Displays user's roles in current company
- Company context is stored in JWT token and persists for the session

**Example:**
```
Current: ABC Construction (Admin, Borrower)
- To switch to XYZ Builders: Log out and log back in
└── Switch to: DEF Contractors (Supervisor)
```

---

## Navigation Icons

**Icon Set Recommendations:**
- Use consistent icon library (e.g., Heroicons, Material Icons)
- Icons should be clear at small sizes (mobile)
- Use filled icons for active states
- Use outlined icons for inactive states

**Icon Mapping:**
- Dashboard: Home/Grid icon
- Marketplace: Search/Magnifying glass icon
- Roster: Users/People icon
- Bookings: Calendar/Clipboard icon
- Time Clock: Clock/Stopwatch icon
- Verification: Checkmark/Shield icon
- Financials: Dollar/Chart icon
- Projects: Folder/Briefcase icon
- Settings: Gear/Cog icon
- Notifications: Bell icon

---

## Breadcrumbs

**Purpose:** Show current location in deep navigation

**Implementation:**
- Display below sidebar header (when sidebar is open)
- Show path: Dashboard > Bookings > Booking Detail
- Clickable breadcrumb segments
- Hide on top-level pages

**Example:**
```
Dashboard > Bookings > #12345 - John Smith
```

---

## Active State Indicators

**Visual Indicators:**
- Active section: Highlighted background, filled icon, bold text
- Active subsection: Indented, secondary highlight
- Hover state: Subtle background change
- Focus state: Outline for keyboard navigation

---

## Accessibility Considerations

**WCAG AA Compliance:**
- Keyboard navigation: All sidebar items keyboard accessible
- Screen reader: Proper ARIA labels for all navigation items
- Focus indicators: Clear focus states for keyboard users
- Color contrast: Meets WCAG AA standards
- Skip links: Skip to main content link

---

## Navigation State Management

**Persistent State:**
- Remember sidebar collapse state (localStorage)
- Remember last visited section per role
- Remember company context selection
- Remember filter preferences

**Session State:**
- Current active section
- Open/closed sidebar state
- Notification read/unread state

---

## Next Steps

This navigation structure will inform:
1. **Front-End Specification:** Detailed wireframes with sidebar implementation
2. **Component Design:** Reusable sidebar navigation component
3. **Routing Structure:** Next.js route organization
4. **State Management:** Navigation state and context switching logic

---

## Related Documentation

- [UX Analysis](./ux-analysis.md) - User personas and flows
- [Customer Journey](../prd/customer-journey.md) - Detailed journey maps
- [Feature Blueprint](../prd/feature-blueprint.md) - Feature overview
- [UI Design Goals](../prd/ui-design-goals.md) - Design principles
