# Front-End Specification

**Created by:** Sally (UX Expert)  
**Date:** January 2026  
**Purpose:** Complete front-end specification including wireframes, component specifications, interaction patterns, and responsive design guidelines for SmartBench platform.

---

## Table of Contents

1. [Design System](#design-system)
2. [Layout Structure](#layout-structure)
3. [Component Specifications](#component-specifications)
4. [Screen Wireframes](#screen-wireframes)
5. [Interaction Patterns](#interaction-patterns)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Accessibility Specifications](#accessibility-specifications)

---

## Design System

### Color Palette

**Primary Colors:**
- **Primary Blue:** `#2563EB` (Primary actions, links, active states)
- **Primary Blue Dark:** `#1E40AF` (Hover states, emphasis)
- **Primary Blue Light:** `#3B82F6` (Secondary actions)

**Neutral Colors:**
- **Gray 900:** `#111827` (Primary text)
- **Gray 700:** `#374151` (Secondary text)
- **Gray 500:** `#6B7280` (Placeholder text, borders)
- **Gray 300:** `#D1D5DB` (Borders, dividers)
- **Gray 100:** `#F3F4F6` (Backgrounds, cards)
- **Gray 50:** `#F9FAFB` (Page backgrounds)

**Status Colors:**
- **Success Green:** `#10B981` (Success states, verified badges)
- **Warning Yellow:** `#F59E0B` (Warnings, pending states)
- **Error Red:** `#EF4444` (Errors, urgent alerts)
- **Info Blue:** `#3B82F6` (Information, notifications)

**Accent Colors:**
- **Construction Orange:** `#F97316` (Industry-specific accents)
- **Trust Gold:** `#FBBF24` (Trust indicators, ratings)

### Typography

**Font Family:**
- **Primary:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Monospace:** "SF Mono", Monaco, "Cascadia Code", monospace (for code/data)

**Font Scale:**
- **H1:** 32px / 40px line-height (Page titles)
- **H2:** 24px / 32px line-height (Section titles)
- **H3:** 20px / 28px line-height (Subsection titles)
- **H4:** 18px / 24px line-height (Card titles)
- **Body Large:** 16px / 24px line-height (Body text)
- **Body:** 14px / 20px line-height (Default body text)
- **Body Small:** 12px / 16px line-height (Captions, labels)
- **Label:** 12px / 16px line-height (Form labels)

**Font Weights:**
- **Regular:** 400 (Body text)
- **Medium:** 500 (Emphasis, labels)
- **Semibold:** 600 (Headings, buttons)
- **Bold:** 700 (Strong emphasis)

### Spacing System

**Base Unit:** 4px

**Spacing Scale:**
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px

### Border Radius

- **sm:** 4px (Buttons, inputs)
- **md:** 8px (Cards, modals)
- **lg:** 12px (Large cards)
- **full:** 9999px (Pills, avatars)

### Shadows

- **sm:** `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Subtle elevation)
- **md:** `0 4px 6px -1px rgba(0, 0, 0, 0.1)` (Cards)
- **lg:** `0 10px 15px -3px rgba(0, 0, 0, 0.1)` (Modals, dropdowns)
- **xl:** `0 20px 25px -5px rgba(0, 0, 0, 0.1)` (Large modals)

---

## Layout Structure

### Main Layout

```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Main Content Area                     │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Page Header                      │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Content Area                     │ │
│         │ │                                  │ │
│         │ │                                  │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
└─────────────────────────────────────────────────┘
```

### Sidebar Layout

**Desktop (Expanded):**
- Width: 280px
- Background: White
- Border-right: 1px solid Gray 300
- Height: 100vh
- Position: Fixed left

**Desktop (Collapsed):**
- Width: 64px
- Icons only, no labels
- Tooltip on hover shows label

**Mobile:**
- Width: 100vw (when open)
- Overlay: Semi-transparent backdrop
- Position: Fixed, slides in from left
- Z-index: 1000

### Main Content Area

**Desktop:**
- Margin-left: 280px (when sidebar expanded)
- Margin-left: 64px (when sidebar collapsed)
- Padding: 24px
- Max-width: 1400px (centered)

**Mobile:**
- Margin-left: 0
- Padding: 16px
- Full width

---

## Component Specifications

### 1. Sidebar Component

**Structure:**
```
┌─────────────────────┐
│ Sidebar Header      │
│ - Company Name      │
│   (read-only)       │
│ - Notifications     │
│ - User Profile      │
├─────────────────────┤
│ Navigation Items    │
│ - Dashboard         │
│ - Marketplace       │
│ - Roster            │
│ - Bookings          │
│ - Time Clock        │
│ - Verification      │
│ - Projects          │
├─────────────────────┤
│ Secondary Nav       │
│ - Saved Searches    │
│ - Settings          │
└─────────────────────┘
```

**Note:** Company context is determined at login time (login-time resolution). The sidebar header displays the current company name as read-only information. To switch companies, users must log out and log back in. There is no company switcher UI component.

**Props:**
- `isOpen: boolean` - Sidebar open/closed state
- `isCollapsed: boolean` - Desktop collapsed state
- `activeSection: string` - Currently active navigation section
- `userRoles: string[]` - User's roles for filtering navigation
- `companyContext: object` - Current company context
- `unreadNotifications: number` - Unread notification count

**States:**
- **Default:** Normal navigation items
- **Active:** Highlighted background, filled icon, bold text
- **Hover:** Subtle background change
- **Disabled:** Grayed out, non-clickable

**Interactions:**
- Click navigation item → Navigate to route
- Click collapse button → Toggle collapsed state (desktop)
- Click hamburger → Toggle open state (mobile)
- Click backdrop → Close sidebar (mobile)

---

### 2. Navigation Item Component

**Structure:**
```
┌─────────────────────────────┐
│ [Icon] Label          [Badge]│
└─────────────────────────────┘
```

**Props:**
- `icon: ReactNode` - Icon component
- `label: string` - Navigation label
- `href: string` - Route path
- `isActive: boolean` - Active state
- `badge?: number` - Optional badge count
- `onClick?: function` - Click handler

**States:**
- **Default:** Gray text, outlined icon
- **Active:** Primary blue background, white text, filled icon
- **Hover:** Light gray background
- **With Badge:** Red badge with count

---

### 3. Dashboard Card Component

**Structure:**
```
┌─────────────────────────────┐
│ Card Title                  │
├─────────────────────────────┤
│ Metric Value                │
│ Metric Label                │
│ [Action Button]             │
└─────────────────────────────┘
```

**Props:**
- `title: string` - Card title
- `value: string | number` - Primary metric value
- `label: string` - Metric label
- `actionLabel?: string` - Optional action button label
- `onAction?: function` - Action button handler
- `variant?: 'default' | 'primary' | 'success' | 'warning'` - Card variant

**Variants:**
- **Default:** White background, gray border
- **Primary:** Primary blue background, white text
- **Success:** Green accent border
- **Warning:** Yellow accent border

---

### 4. Worker Card Component (Marketplace)

**Structure:**
```
┌─────────────────────────────┐
│ [Photo] Name                 │
│         Trade                │
│         ⭐ 4.8 (24 reviews)  │
│         $45/hr               │
│         Available: Mon-Fri   │
│         [Add to Cart]        │
└─────────────────────────────┘
```

**Props:**
- `worker: object` - Worker data
- `onAddToCart: function` - Add to cart handler
- `showCompanyName: boolean` - Show/hide company name

**States:**
- **Default:** Full card visible
- **In Cart:** "In Cart" badge, disabled button
- **Unavailable:** Grayed out, "Unavailable" badge

---

### 5. Booking Card Component

**Structure:**
```
┌─────────────────────────────┐
│ Booking #12345        [Status]│
│ Worker: John Smith           │
│ Dates: Jan 15-20, 2026       │
│ Hours: 40                    │
│ Total: $1,800                │
│ [View Details]               │
└─────────────────────────────┘
```

**Props:**
- `booking: object` - Booking data
- `status: string` - Booking status
- `onViewDetails: function` - View details handler
- `role: 'borrower' | 'lender' | 'worker'` - User's role context

**Status Badges:**
- **Active:** Green badge
- **Pending:** Yellow badge
- **Completed:** Gray badge
- **Cancelled:** Red badge

---

### 6. Time Clock Component

**Structure:**
```
┌─────────────────────────────┐
│ Current Shift                │
│                              │
│ Project: ABC Construction    │
│ Location: 123 Main St        │
│ Supervisor: Jane Doe         │
│                              │
│ [Clock In] / [Clock Out]    │
│                              │
│ Elapsed Time: 4h 23m         │
│                              │
│ [Log Break] [Log Travel]     │
└─────────────────────────────┘
```

**Props:**
- `shift: object` - Current shift data
- `isClockedIn: boolean` - Clock in/out state
- `onClockIn: function` - Clock in handler
- `onClockOut: function` - Clock out handler
- `onLogBreak: function` - Log break handler
- `onLogTravel: function` - Log travel handler

**States:**
- **Not Clocked In:** "Clock In" button enabled
- **Clocked In:** "Clock Out" button enabled, timer running
- **Offline:** "Offline" indicator, sync pending badge

---

### 7. Verification Card Component

**Structure:**
```
┌─────────────────────────────┐
│ Timesheet #12345     [Urgent]│
│ Worker: John Smith           │
│ Date: Jan 15, 2026          │
│                              │
│ Hours: 8.0                   │
│ System Time: 8.0h            │
│ Submitted Time: 8.0h         │
│                              │
│ [View GPS] [View Photos]     │
│                              │
│ [Approve] [Dispute]          │
└─────────────────────────────┘
```

**Props:**
- `timesheet: object` - Timesheet data
- `onApprove: function` - Approve handler
- `onDispute: function` - Dispute handler
- `onViewDetails: function` - View details handler
- `isUrgent: boolean` - Urgent flag (>2 hours old)

**States:**
- **Pending:** Yellow border, "Pending" badge
- **Urgent:** Red border, "Urgent" badge
- **Approved:** Green border, "Approved" badge
- **Disputed:** Red border, "Disputed" badge

---

```

**Props:**
- `availableBalance: number` - Available balance
- `escrowBalance: number` - Funds held via Stripe escrow/hold (disputed funds)
- `onWithdraw: function` - Withdraw handler
- `onViewDetails: function` - View details handler

---

### 9. Form Input Component

**Structure:**
```
┌─────────────────────────────┐
│ Label                        │
│ ┌─────────────────────────┐ │
│ │ Input value              │ │
│ └─────────────────────────┘ │
│ Helper text / Error message  │
└─────────────────────────────┘
```

**Props:**
- `label: string` - Input label
- `type: string` - Input type
- `value: string` - Input value
- `onChange: function` - Change handler
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `required?: boolean` - Required flag
- `disabled?: boolean` - Disabled state

**States:**
- **Default:** Gray border
- **Focus:** Primary blue border
- **Error:** Red border, error message
- **Disabled:** Gray background, disabled cursor

---

### 10. Button Component

**Variants:**
- **Primary:** Primary blue background, white text
- **Secondary:** White background, primary blue border
- **Tertiary:** Transparent background, primary blue text
- **Danger:** Red background, white text
- **Success:** Green background, white text

**Sizes:**
- **sm:** 32px height
- **md:** 40px height (default)
- **lg:** 48px height

**States:**
- **Default:** Normal state
- **Hover:** Darker shade
- **Active:** Pressed state
- **Disabled:** Grayed out, non-clickable
- **Loading:** Spinner icon, disabled

---

## Screen Wireframes

### 1. Dashboard Screen (Borrower)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Dashboard                             │
│         │                                       │
│         │ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│         │ │ Active   │ │ Pending  │ │ Stripe ││
│         │ │ Bookings │ │ Verify   │ │ Balance││
│         │ │    5     │ │    3     │ │ $2,450 ││
│         │ └──────────┘ └──────────┘ └─────────┘│
│         │                                       │
│         │ Recent Bookings                      │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Booking #12345                   │ │
│         │ │ Worker: John Smith                │ │
│         │ │ Status: Active                    │ │
│         │ └─────────────────────────────────┘ │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Booking #12346                   │ │
│         │ │ Worker: Jane Doe                 │ │
│         │ │ Status: Pending Verification     │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ Quick Actions                        │
│         │ [Search Workers] [Create Project]    │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- 3 metric cards at top (Active Bookings, Pending Verifications, Stripe Balance)
- Recent bookings list (last 5)
- Quick action buttons
- Responsive grid layout

---

### 2. Marketplace Search Screen

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Marketplace                          │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Search: [Electrician...]        │ │
│         │ │ Filters: [Trade ▼] [Location ▼] │ │
│         │ │         [Rating ▼] [Price ▼]     │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ Results (24 found)                  │
│         │ ┌──────────┐ ┌──────────┐ ┌────────┐│
│         │ │ [Photo]  │ │ [Photo]  │ │ [Photo]││
│         │ │ John S.  │ │ Jane D.  │ │ Mike R.││
│         │ │ Electric │ │ Electric │ │ Plumber││
│         │ │ ⭐ 4.8   │ │ ⭐ 4.9   │ │ ⭐ 4.7 ││
│         │ │ $45/hr  │ │ $50/hr  │ │ $40/hr ││
│         │ │ [Add]    │ │ [Add]    │ │ [Add]  ││
│         │ └──────────┘ └──────────┘ └────────┘│
│         │                                       │
│         │ [Load More]                          │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- Search bar with filters
- Grid layout for worker cards (3 columns desktop, 1 column mobile)
- Pagination or infinite scroll
- Cart icon in sidebar header

### 2.1 Search State Management & Error Handling

#### Degraded Search State UI

**When to Show:** When API returns `200 OK` with `meta.degraded` object indicating partial extension failures (e.g., geo search unavailable).

**UI Pattern:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Location-based search is temporarily         │
│    unavailable. Showing text-only results.      │
│    [ℹ️]                                         │
└─────────────────────────────────────────────────┘
```

**Components:**
- **Warning Banner:** Yellow/amber background (#F59E0B), positioned below search filters
- **Message:** "Location-based search is temporarily unavailable. Showing text-only results."
- **Info Icon:** Clickable info icon (ℹ️) with tooltip explaining degraded state
- **Filter Behavior:** 
  - Disable or hide geo-related filters (distance radius, zip code search) when geo extension unavailable
  - Show disabled state with tooltip: "Location filters unavailable"
- **User Action:** Allow user to continue with text-only search

**Visual Design:**
- Banner height: 48px
- Padding: 16px horizontal, 12px vertical
- Border: 1px solid warning yellow
- Icon: 20px, positioned right
- Dismissible: Optional close button (X) to dismiss banner

**Accessibility:**
- `role="alert"` for screen reader announcement
- `aria-live="polite"` for non-intrusive announcement
- Tooltip accessible via keyboard (Tab to focus, Enter to open)

#### Search Error UI Patterns

**Search Timeout Error:**
```
┌─────────────────────────────────────────────────┐
│ Search Results                                  │
│                                                 │
│ ⚠️ Search is taking longer than expected.      │
│    Try narrowing your filters or [Retry]        │
└─────────────────────────────────────────────────┘
```

- **Display:** Inline error message above search results
- **Message:** "Search is taking longer than expected. Try narrowing your filters or [Retry]."
- **Action:** Retry button (primary style) to retry search
- **Visual:** Warning icon (⚠️), yellow/amber accent color

**Rate Limiting Error (429):**
- **Display:** Toast notification (top-right)
- **Message:** "Too many search requests. Please wait a moment before searching again."
- **Duration:** Auto-dismiss after 5 seconds
- **Visual:** Error toast (red background), error icon
- **Action:** No retry button (user must wait)

**Extension Failure Error:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Search service temporarily unavailable.     │
│    Please try again in a few moments.           │
└─────────────────────────────────────────────────┘
```

- **Display:** Banner at top of search area (red background)
- **Message:** "Search service temporarily unavailable. Please try again in a few moments."
- **Visual:** Error banner (red background #EF4444), error icon
- **Action:** Auto-retry after 30 seconds, or manual retry button

**Filter Validation Error:**
- **Display:** Inline validation errors below invalid filters
- **Message:** Specific error for each invalid filter (e.g., "Invalid date range", "Distance must be between 1-100 miles")
- **Visual:** Red border on invalid input, error message below
- **Behavior:** Real-time validation on blur, prevent search submission until valid

**Error Recovery Patterns:**
- **Retry:** Primary action button to retry failed search
- **Filter Adjustment:** Suggest narrowing filters for timeout errors
- **Clear Filters:** Option to clear all filters and start fresh
- **Back to Default:** Reset to default search state

#### Frontend Caching Strategy

**Recommended Approach:** No frontend caching - always fetch fresh results from API

**Rationale:**
- Ensures real-time availability accuracy
- Simpler state management
- Slight performance trade-off (acceptable for search)

**Alternative Approach (Optional):** Short-lived frontend cache (30 seconds) with manual invalidation

**If Caching Implemented:**
- **Cache Key Format:** `search:{filters_hash}:page:{page}`
- **TTL:** 30 seconds
- **Invalidation Triggers:**
  - Cart addition
  - Booking creation
  - Manual refresh button
  - Cache age > 30 seconds
- **Stale Indicator:** Show subtle indicator if cache age > 30 seconds: "Results from [X] seconds ago"

**Cache Interaction with Real-Time Availability:**
- Availability is always checked server-side (real-time)
- Frontend cache is for UX only, not availability guarantees
- Final availability check at checkout always uses fresh data
- If cached result shows worker available but server check fails, show: "Worker no longer available"

#### Pagination Error Handling

**Scenario:** Worker availability changes between pagination requests

**User Experience:**
- Each page request queries database in real-time
- Workers may appear/disappear between pages if availability changes
- This is expected behavior - workers shown on page 1 may not be available when user views page 2

**Error Handling:**
- If worker becomes unavailable between pages, show message when user tries to add to cart:
  ```
  ⚠️ Worker no longer available
     This worker is no longer available. Please select another worker.
     [Remove from View] [View Similar Workers]
  ```
- **Visual:** Warning message above worker card or inline in cart
- **Actions:** 
  - "Remove from View" - Removes worker from current page view
  - "View Similar Workers" - Opens new search with similar criteria

**Pagination Consistency Note:**
- Display subtle indicator: "Results update in real-time. Availability may change."
- Position: Below pagination controls, small gray text

### 2.2 Saved Search Alert Status UI

**Purpose:** Allow users to view and manage saved search alerts, including alert status, history, and failure visibility.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Saved Searches                        │
│         │                                       │
│         │ My Saved Searches                     │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Electrician - Downtown           │
│         │ │ Status: Active                   │
│         │ │ Last sent: Jan 25, 2026 2:30 PM  │
│         │ │ [Edit] [Test Alert] [Delete]    │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Plumber - 50 miles               │
│         │ │ Status: Active                   │
│         │ │ Last sent: Jan 20, 2026 10:15 AM │
│         │ │ ⚠️ Warning: No alerts sent in 7+ │
│         │ │    days. Alert may have failed.  │
│         │ │ [Edit] [Test Alert] [Delete]    │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Carpenter - Weekends             │
│         │ │ Status: Failed                   │
│         │ │ Failed: Jan 22, 2026 3:45 PM     │
│         │ │ [View History] [Edit] [Delete]  │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ [Create New Saved Search]            │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Alert Status Indicators:**

**Active Status:**
- **Badge:** Green "Active" badge
- **Display:** "Last sent: [date] [time]"
- **Visual:** Green checkmark icon (✓)

**Warning Status (No alerts in 7+ days):**
- **Badge:** Yellow "Warning" badge
- **Message:** "Warning: No alerts sent in 7+ days. Alert may have failed."
- **Visual:** Yellow warning icon (⚠️)
- **Action:** "Test Alert" button highlighted

**Failed Status:**
- **Badge:** Red "Failed" badge
- **Display:** "Failed: [date] [time]"
- **Visual:** Red error icon (✗)
- **Action:** "View History" button to see failure details

**Alert History Section:**

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Alert History - Electrician - Downtown          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Jan 25, 2026 2:30 PM                           │
│ ✓ Success - 3 workers found                     │
│                                                 │
│ Jan 24, 2026 2:30 PM                           │
│ ✓ Success - 5 workers found                    │
│                                                 │
│ Jan 23, 2026 2:30 PM                           │
│ ✗ Failed - Error: Service unavailable          │
│                                                 │
│ Jan 22, 2026 2:30 PM                           │
│ ✓ Success - 2 workers found                     │
│                                                 │
│ [Close]                                         │
└─────────────────────────────────────────────────┘
```

**History Entry Display:**
- **Success Entry:**
  - Green checkmark (✓)
  - "Success - [X] workers found"
  - Date and time
- **Failed Entry:**
  - Red X (✗)
  - "Failed - Error: [error message]"
  - Date and time
- **Chronological Order:** Most recent first
- **Retention:** Show last 30 days of history

**Test Alert Button:**

**Functionality:**
- **Trigger:** Manual "Test Alert" button on saved search card
- **Action:** Immediately sends test alert email/notification
- **Loading State:** Button shows spinner during test
- **Success:** Toast notification: "Test alert sent successfully. Check your email."
- **Failure:** Toast notification: "Test alert failed. [Error message]"
- **Purpose:** Verify alert functionality without waiting for scheduled run

**Alert Status Visibility Rules:**

**Status Calculation:**
- **Active:** Alert sent successfully within last 7 days
- **Warning:** No successful alert in 7+ days (may indicate failure)
- **Failed:** Last alert attempt resulted in error

**User Preferences (Optional):**
- **Alert Failure Notifications:** User preference to receive notifications when alerts fail
- **Notification Frequency:** Daily digest vs. immediate notification
- **Settings Location:** User settings → Notifications → Alert Failure Notifications

**Accessibility:**
- Status badges have `aria-label` with full status description
- Alert history accessible via keyboard navigation
- Screen reader announces status changes
- Test alert button has descriptive `aria-label`

**Responsive Behavior:**
- **Desktop:** Full card layout with all details visible
- **Tablet:** Condensed card layout, history in modal
- **Mobile:** Stacked layout, history in full-screen modal

---

### 3. Time Clock Screen (Worker)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Time Clock                            │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Current Shift                    │ │
│         │ │                                  │ │
│         │ │ Project: ABC Construction        │ │
│         │ │ Location: 123 Main St           │ │
│         │ │ Supervisor: Jane Doe             │ │
│         │ │                                  │ │
│         │ │ ⏱️ 4h 23m                        │ │
│         │ │                                  │ │
│         │ │ [Clock Out]                      │ │
│         │ │                                  │ │
│         │ │ [Log Break] [Log Travel]         │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ Upcoming Shifts                      │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Tomorrow, Jan 16                │ │
│         │ │ 7:00 AM - 5:00 PM                │ │
│         │ │ [View Details]                   │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- Large, prominent clock in/out button
- Current shift details
- Timer display
- Quick actions for breaks/travel
- Upcoming shifts list

---

### 4. Verification Dashboard (Supervisor)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Verification                         │
│         │                                       │
│         │ Pending Verifications (5)            │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Timesheet #12345      [Urgent]  │ │
│         │ │ Worker: John Smith               │ │
│         │ │ Date: Jan 15, 2026               │ │
│         │ │ Hours: 8.0                       │ │
│         │ │ [View Details] [Approve] [Dispute]│ │
│         │ └─────────────────────────────────┘ │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Timesheet #12346                 │ │
│         │ │ Worker: Jane Doe                 │ │
│         │ │ Date: Jan 15, 2026               │ │
│         │ │ Hours: 7.5                       │ │
│         │ │ [View Details] [Approve] [Dispute]│ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- List of pending verifications
- Urgent badge for items >2 hours old
- Quick approve/dispute actions
- Timesheet detail modal on click

---

### 5. Booking Detail Screen

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Booking #12345                        │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Status: Active                    │ │
│         │ │ Worker: John Smith                │ │
│         │ │ Dates: Jan 15-20, 2026            │ │
│         │ │ Hours: 40                         │ │
│         │ │ Rate: $45/hr                      │ │
│         │ │ Total: $1,800                     │ │
│         │ │                                   │ │
│         │ │ Supervisor: Jane Doe              │ │
│         │ │ Payment: Paid (Held via Stripe)   │ │
│         │ │                                   │ │
│         │ │ [Cancel Booking] [View Timesheet]│ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ Shift Schedule                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Jan 15: 8:00 AM - 5:00 PM ✓      │ │
│         │ │ Jan 16: 8:00 AM - 5:00 PM ✓      │ │
│         │ │ Jan 17: 8:00 AM - 5:00 PM ⏳      │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- Booking information card
- Status badge
- Shift schedule timeline
- Contextual actions based on role
- Payment status indicator

---

### 6. Checkout Screen (Borrower)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Sidebar │ Checkout                              │
│         │                                       │
│         │ Step 1: Cart Review ✓                 │
│         │ Step 2: Project Selection ✓           │
│         │ Step 3: Supervisor Assignment ✓       │
│         │ Step 4: Policy Acknowledgment ✓       │
│         │ Step 5: Payment (Current)             │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Payment Summary                  │ │
│         │ │                                  │ │
│         │ │ Worker Rate:          $769.23  │ │
│         │ │ Service Fee (30%):     $230.77  │ │
│         │ │ ─────────────────────────────── │ │
│         │ │ Total to Charge:      $1,000.00 │ │
│         │ │                                  │ │
│         │ │                                  │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
│         │ ┌─────────────────────────────────┐ │
│         │ │ Payment Method                   │ │
│         │ │                                  │ │
│         │ │ [Credit Card Form]               │ │
│         │ │ Card Number: [____]              │ │
│         │ │ Expiry: [MM/YY]                  │ │
│         │ │ CVV: [___]                       │ │
│         │ │                                  │ │
│         │ │ [Complete Payment]               │ │
│         │ └─────────────────────────────────┘ │
│         │                                       │
└─────────────────────────────────────────────────┘
```

**Key Elements:**
- Multi-step progress indicator showing current step
- Payment summary clearly showing:
  - Worker Rate
  - Service Fee (30%)
  - Total amount to charge
- Credit card form for full payment
- Clear messaging: "Total Charge: $X.XX (Worker Rate + Service Fee)"

**Business Rules:**
- Full booking total (Worker Rate + Service Fee) charged to credit card
- Payment breakdown must clearly show: Worker Rate → Service Fee (30%) → Total Charge
- See [Epic 6: Story 6.2](../prd/epic-6.md#story-62-payment-processing-service-fee) for complete payment processing logic

---

## Interaction Patterns

### 1. Sidebar Navigation

**Desktop:**
- Click navigation item → Navigate to route
- Click collapse button → Toggle collapsed state
- Hover collapsed item → Show tooltip with label
- Keyboard: Tab through items, Enter to select

**Mobile:**
- Click hamburger → Open sidebar overlay
- Click navigation item → Navigate and close sidebar
- Click backdrop → Close sidebar
- Swipe left on sidebar → Close sidebar

---

### 2. Form Interactions

**Input Focus:**
- Focus → Blue border, label moves up (if floating label)
- Blur → Validate input, show error if invalid
- Change → Real-time validation (debounced)

**Button States:**
- Hover → Darker shade
- Click → Loading state (if async action)
- Success → Success message, redirect (if applicable)
- Error → Error message below button

---

### 3. Modal/Dialog Patterns

**Opening:**
- Click trigger → Modal slides in from center
- Backdrop fades in
- Focus trap activated

**Closing:**
- Click backdrop → Close modal (disabled for required modals)
- Click X button → Close modal (disabled for required modals)
- Press Escape → Close modal (disabled for required modals)
- Submit form → Close modal (if success)

**Dispute Fork Modal (Required Action):**
- **Purpose:** Supervisor must select Option A or Option B before filing dispute
- **Trigger:** Supervisor clicks "Dispute" button on timesheet
- **Modal Behavior:** 
  - Modal cannot be dismissed without selection (no backdrop click, no X button, Escape disabled)
  - Focus trap active - user must select an option
  - Two large, prominent option buttons displayed side-by-side
- **Option A Button:**
  - Label: "Dispute Shift Only"
  - Subtitle: "Continue Employment"
  - Description: "Used for disagreements on hours/breaks where the relationship is still good."
  - Visual indicator: Green/blue accent color
  - Icon: Clock or shift icon
- **Option B Button:**
  - Label: "End Booking & Dispute"
  - Subtitle: "Termination"
  - Description: "Used for performance issues, no-shows, or safety incidents."
  - Visual indicator: Red/orange accent color
  - Icon: Stop or cancel icon
- **Layout:**
  - Desktop: Two buttons side-by-side (50% width each)
  - Mobile: Two buttons stacked vertically (100% width each)
  - Buttons: Large, prominent (min 200px height on desktop)
  - Spacing: 16px gap between buttons
- **Selection:**
  - Clicking either button immediately files the dispute with selected option
  - Button shows loading state during API call
  - On success: Modal closes, dispute resolution chat opens
  - On error: Error message displayed in modal, user can retry
- **Error States:**
  - If API returns error (e.g., `DISPUTE_OPTION_REQUIRED`), show error message above buttons
  - Error message: "You must select an option before filing the dispute. Choose 'Dispute Shift Only' to continue the booking or 'End Booking & Dispute' to terminate."
  - Buttons remain enabled for retry
- **Accessibility:**
  - Modal has `role="dialog"` and `aria-modal="true"`
  - Title: "Select Dispute Resolution Path"
  - Buttons have descriptive `aria-label` attributes
  - Focus automatically moves to first option button when modal opens
  - Keyboard navigation: Tab cycles between options, Enter selects

---

### 4. Loading States

**Skeleton Loaders:**
- Show skeleton while data loads
- Match content structure
- Animate with shimmer effect

**Spinner:**
- Show spinner for async actions
- Center in container
- Disable interaction during load

**Progress Indicators:**
- Show progress for multi-step processes
- Step indicator with current step highlighted
- Percentage or step count

---

### 5. Error Handling

**Form Errors:**
- Inline error messages below inputs
- Red border on invalid inputs
- Summary at top of form (if multiple errors)

**API Errors:**
- Toast notification for errors
- Retry button for failed requests
- Clear error messages

**Validation Errors:**
- Real-time validation (debounced)
- Clear error on input change
- Submit button disabled until valid

---

## Responsive Breakpoints

### Breakpoint Definitions

**Mobile:**
- Min: 0px
- Max: 767px
- Sidebar: Overlay (hidden by default)
- Layout: Single column
- Navigation: Hamburger menu

**Tablet:**
- Min: 768px
- Max: 1023px
- Sidebar: Collapsible (icon-only when collapsed)
- Layout: 2 columns (where applicable)
- Navigation: Sidebar with icons

**Desktop:**
- Min: 1024px
- Max: 1439px
- Sidebar: Persistent (expanded by default)
- Layout: 3 columns (where applicable)
- Navigation: Full sidebar with labels

**Large Desktop:**
- Min: 1440px
- Max: Infinity
- Sidebar: Persistent (expanded)
- Layout: 3-4 columns (where applicable)
- Navigation: Full sidebar with labels
- Max-width container: 1400px (centered)

---

### Responsive Behavior

**Grid Layouts:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Large Desktop: 3-4 columns

**Typography:**
- Mobile: Smaller font sizes (H1: 24px, Body: 14px)
- Desktop: Standard font sizes (H1: 32px, Body: 16px)

**Spacing:**
- Mobile: Reduced padding (16px)
- Desktop: Standard padding (24px)

**Touch Targets:**
- Minimum: 44x44px (mobile)
- Recommended: 48x48px (mobile)
- Desktop: 40x40px minimum

---

## Accessibility Specifications

### WCAG AA Compliance

**Color Contrast:**
- Text on background: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Tab order follows visual order
- Focus indicators visible (2px outline)
- Skip links for main content

**Screen Readers:**
- Semantic HTML elements
- ARIA labels for icons and buttons
- ARIA live regions for dynamic content
- Form labels associated with inputs

**Focus Management:**
- Focus trap in modals
- Focus return after modal close
- Focus visible on all interactive elements
- No keyboard traps

---

### Accessibility Features

**Alt Text:**
- All images have descriptive alt text
- Decorative images have empty alt text
- Icons have aria-label or aria-labelledby

**Form Accessibility:**
- Labels associated with inputs (for/id)
- Error messages associated with inputs (aria-describedby)
- Required fields indicated (aria-required)
- Fieldset/legend for grouped inputs

**Interactive Elements:**
- Buttons have descriptive text or aria-label
- Links have descriptive text (not "click here")
- Disabled state communicated (aria-disabled)
- Loading state communicated (aria-busy)

---

### 11. Dispute Resolution Interface Components

This section covers UI components for dispute resolution workflows, including incident reports, timesheet disputes, and shift cancellation actions.

#### 11.1 Fork in the Road Modal (Dispute Filing)

**Purpose:** When a Supervisor clicks "Dispute" on a timesheet or files an incident report, they MUST select one of two paths before the dispute can be filed. This modal presents the two mandatory options and requires selection.

**Structure:**
```
┌─────────────────────────────────────────────┐
│ File Dispute                                │
├─────────────────────────────────────────────┤
│                                             │
│ You must choose how to proceed with this    │
│ dispute. This decision cannot be changed    │
│ later.                                      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Option A: Dispute Shift Only            │ │
│ │ (Continue Employment)                   │ │
│ │                                         │ │
│ │ ✓ Booking remains Active                │ │
│ │ ✓ Worker CAN clock in for future shifts │ │
│ │ ✓ Only disputed shift funds frozen      │ │
│ │                                         │ │
│ │ Use for: Disagreements on hours/breaks  │ │
│ │ where the relationship is still good.    │ │
│ │                                         │ │
│ │ [Select Option A]                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Option B: End Booking & Dispute         │ │
│ │ (Termination)                           │ │
│ │                                         │ │
│ │ ✗ Booking immediately Cancelled         │ │
│ │ ✗ Worker released immediately           │ │
│ │ ✗ Future shifts removed                 │ │
│ │ ✗ Total freeze: Shift + Cancellation   │ │
│ │   Penalty                                │ │
│ │                                         │ │
│ │ Use for: Performance issues, no-shows,  │ │
│ │ or safety incidents.                    │ │
│ │                                         │ │
│ │ [Select Option B]                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Cancel]                                    │
└─────────────────────────────────────────────┘
```

**Props:**
- `timesheetId?: string` - Timesheet ID (for timesheet disputes)
- `incidentId?: string` - Incident ID (for incident reports)
- `bookingId: string` - Booking ID
- `onSelectOptionA: function` - Handler for Option A selection
- `onSelectOptionB: function` - Handler for Option B selection
- `onCancel: function` - Cancel handler (closes modal without filing dispute)
- `disputeType: 'timesheet' | 'incident'` - Type of dispute being filed

**Modal States:**

**Default State:**
- Both options displayed as cards with equal visual weight
- Neither option selected
- "Cancel" button visible (allows user to exit without filing)
- Submit/Continue button disabled until option selected

**Option Selected State:**
- Selected option highlighted (blue border, subtle background)
- Unselected option dimmed (reduced opacity)
- "File Dispute" button enabled (primary action)
- "Cancel" button still visible

**Visual Design:**
- **Option Cards:** White background, subtle border, hover effect
- **Selected State:** Primary blue border (2px), light blue background tint
- **Icons:** Checkmark (✓) for Option A benefits, X (✗) for Option B consequences
- **Typography:** Clear headings, bullet points for benefits/consequences
- **Spacing:** Generous padding between options (24px)

**Interaction Patterns:**
- **Click Option Card:** Selects that option, enables "File Dispute" button
- **Click "File Dispute":** Submits dispute with selected option, closes modal
- **Click "Cancel":** Closes modal without filing dispute
- **Escape Key:** Closes modal (same as Cancel)
- **Backdrop Click:** Does NOT close modal (destructive action requires explicit cancel)

**Validation:**
- **Required Selection:** Cannot proceed without selecting Option A or B
- **Error State:** If user attempts to submit without selection, show inline error: "Please select an option before filing the dispute."
- **API Validation:** Backend validates `disputeOption` field (must be "Option_A" or "Option_B")

**Accessibility:**
- Modal has `role="dialog"` and `aria-labelledby` pointing to "File Dispute" title
- Option cards are keyboard navigable (Tab to move, Enter/Space to select)
- Selected option has `aria-checked="true"`, unselected has `aria-checked="false"`
- Focus trap within modal
- Screen reader announces: "Dialog opened: File dispute. You must select an option."
- Clear focus indicators on all interactive elements

**Responsive Behavior:**
- **Desktop:** Modal centered, 600px width, max-height 80vh with scroll
- **Tablet:** Modal centered, 500px width
- **Mobile:** Full-screen modal with close button in header

**Error Handling:**
- **Network Error:** Toast notification with retry option
- **Validation Error:** Inline error message below options
- **API Error:** Error toast with specific message (e.g., "Unable to file dispute. Please try again.")

**Business Rules:**
- **Mandatory Selection:** User cannot file dispute without selecting Option A or B
- **No Deferral:** Selection must be made at moment of dispute filing - cannot be deferred
- **Immediate Effect:** Option B immediately cancels booking (no confirmation step)
- **Option A Effect:** Booking remains Active, only disputed shift funds frozen

#### 11.2 Cancel Remaining Shifts Button Component

**Structure:**
```
┌─────────────────────────────────────────────┐
│ Dispute Resolution Interface                │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Current Shift Dispute                    │ │
│ │ Status: Disputed                         │ │
│ │ Amount: $800.00 (Frozen in Escrow)       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Future Shifts                            │ │
│ │ • Jan 16: 8:00 AM - 5:00 PM             │ │
│ │ • Jan 17: 8:00 AM - 5:00 PM             │ │
│ │ • Jan 18: 8:00 AM - 5:00 PM             │ │
│ │ Total: $1,200.00                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Cancel Remaining Shifts]                   │
│ (Secondary/Danger button style)             │
└─────────────────────────────────────────────┘
```

**Props:**
- `bookingId: string` - Booking ID for cancellation
- `futureShifts: array` - Array of future shift objects
- `onCancel: function` - Cancel handler (opens confirmation dialog)
- `isDisabled: boolean` - Disabled state (e.g., if already cancelled)
- `role: 'borrower' | 'lender'` - User's role context

**Placement:**
- **Location:** Dispute Resolution interface, below the dispute details section
- **Visual Separation:** Placed in a distinct section with clear visual separation from dispute resolution actions
- **Prominence:** Secondary/Danger button style (outlined red or red background) to indicate destructive action
- **Context:** Always visible when dispute is active and future shifts exist

**Button States:**
- **Default:** Outlined red button with "Cancel Remaining Shifts" label
- **Hover:** Darker red border/background
- **Disabled:** Grayed out when no future shifts exist or already cancelled
- **Loading:** Spinner icon when cancellation is processing

**Confirmation Dialog Flow:**

**Step 1: Initial Confirmation**
```
┌─────────────────────────────────────────────┐
│ Cancel Remaining Shifts?                    │
├─────────────────────────────────────────────┤
│                                             │
│ This will cancel all future shifts for this │
│ booking. The current dispute will continue. │
│                                             │
│ Shifts to be cancelled:                     │
│ ┌─────────────────────────────────────────┐ │
│ │ • Jan 16: 8:00 AM - 5:00 PM             │ │
│ │ • Jan 17: 8:00 AM - 5:00 PM             │ │
│ │ • Jan 18: 8:00 AM - 5:00 PM             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Cancellation Policy:                        │
│ • Refund: $1,200.00 (100% refund)          │
│ • Penalty: $0.00 (24+ hour notice)         │
│                                             │
│ [Cancel] [Confirm Cancellation]             │
└─────────────────────────────────────────────┘
```

**Step 2: Visual Indicators**
- **Shift List:** Display all future shifts with dates, times, and amounts
- **Policy Summary:** Show cancellation policy calculation (refund amount, penalty amount based on 24-hour notice rule)
- **Warning Message:** "This action cannot be undone. The dispute for the current shift will continue separately."
- **Impact Summary:** Clear indication of what will be cancelled vs. what remains in dispute

**Step 3: Success/Error Messaging**

**Success State:**
- **Toast Notification:** Green success toast: "Future shifts cancelled successfully. Dispute for current shift continues."
- **UI Update:** Future shifts section updates to show "Cancelled" status
- **Button State:** Button changes to disabled state with "Shifts Cancelled" label

**Error State:**
- **Error Toast:** Red error toast with specific error message
- **Common Errors:**
  - "Unable to cancel shifts. Please try again."
  - "Shifts have already been cancelled."
  - "Network error. Please check your connection."

**Interaction Patterns:**
- **Click Button:** Opens confirmation dialog
- **Click Confirm:** Processes cancellation, shows loading state, then success/error message
- **Click Cancel:** Closes dialog, no action taken
- **Escape Key:** Closes dialog
- **Backdrop Click:** Closes dialog (non-destructive action)

**Accessibility:**
- Button has `aria-label`: "Cancel remaining shifts for this booking"
- Dialog has `role="dialog"` and `aria-labelledby` pointing to dialog title
- Focus trap within dialog
- Focus returns to button after dialog closes
- Screen reader announces: "Dialog opened: Cancel remaining shifts confirmation"

**Responsive Behavior:**
- **Desktop:** Dialog centered, 600px width
- **Mobile:** Full-screen modal with close button in header
- **Tablet:** Dialog centered, 500px width

#### 11.2 Dispute Resolution Chat Interface

**Note:** The shared Evidence Locker UI has been removed. Evidence is now injected into the chat stream as system messages. Super Admin has read-only access to all evidence via the Super Admin dashboard (see Epic 7.9).

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Dispute Resolution - Timesheet #12345                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Resolution Chat                                     │ │
│ │                                                     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ System: Dispute filed                          │ │ │
│ │ │ 2:30 PM                                        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ System: Supervisor Edited time to 7.5 hours    │ │ │
│ │ │ Note: "Added 30-minute lunch break"            │ │ │
│ │ │ 2:30 PM                                        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ System: Worker Rejected. Comment: "I took a    │ │ │
│ │ │ 15-minute break, not 30 minutes"               │ │ │
│ │ │ 2:35 PM                                        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ System: GPS Data - [Location Link]             │ │ │
│ │ │ Clock-In: 8:00 AM (GPS Verified)              │ │ │
│ │ │ Clock-Out: 5:00 PM (GPS Verified)             │ │ │
│ │ │ 2:35 PM                                        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ Borrower Admin: I dispute the 30-minute lunch │ │ │
│ │ │ deduction. Worker only took 15 minutes.      │ │ │
│ │ │ 2:40 PM                                        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ Lender Admin: I agree. Let's split the         │ │ │
│ │ │ difference - 22.5 minutes.                     │ │ │
│ │ │ 2:45 PM                                        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │                                                     │ │
│ │ [Type message...]                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Cancel Remaining Shifts]                                │
└──────────────────────────────────────────────────────────┘
```

**Layout Structure:**
- **Single-Panel Layout:** Chat-only interface (Evidence Locker UI removed)
- **Responsive:** Full-width on mobile and desktop
- **System-Injected Evidence:** Evidence appears as system messages in chat stream

**Props:**
- `disputeId: string` - Dispute ID
- `disputedAmount: number` - Amount held via Stripe escrow/hold
- `messages: array` - Chat messages array (includes system-injected evidence messages)
- `onSendMessage: function` - Send message handler
- `userRole: 'borrower' | 'lender'` - Current user's role

**System-Injected Evidence Messages:**

The system automatically injects evidence into the chat stream as system messages when a dispute is filed:

1. **Supervisor Edit Evidence:**
   - Message: "System: Supervisor Edited time to [Time]. Note: [Note]"
   - Appears when supervisor edited time during Negotiation Loop

2. **Worker Rejection Evidence:**
   - Message: "System: Worker Rejected. Comment: [Comment]"
   - Appears when worker rejected supervisor's edit

3. **GPS Data Evidence:**
   - Message: "System: GPS Data - [Location Link]"
   - Includes clickable link to view GPS map with clock-in/out locations
   - Shows GPS verification status for each timestamp

4. **Photo Evidence:**
   - Message: "System: Project Photos - [Photo Gallery]"
   - Includes clickable thumbnails that expand to full-size photos

5. **Timesheet Data Evidence:**
   - Message: "System: Timesheet Data - Clock-In: [Time], Clock-Out: [Time], Break: [Duration], Lunch: [Duration]"
   - Shows complete timesheet information

6. **Clock-In Acknowledged Evidence:**
   - Message: "System: Clock-In Acknowledged by [Supervisor Name] at [Timestamp] via [Method: deep_link_clicked/app_opened]"
   - Appears when supervisor acknowledged clock-in notification
   - Shows method of acknowledgment (deep link clicked or app opened)

**Additional Evidence for Incident Report Disputes:**

7. **Incident Report Evidence:**
   - Message: "System: Incident Report - Severity: [Severity], Type: [Type], Notes: [Notes], Reported at: [Timestamp]"
   - Appears only for disputes originating from incident reports
   - Shows incident details including severity, type, notes, and timestamp

8. **Incident Photos:**
   - Message: "System: Incident Photos - [Photo Gallery]"
   - Appears only if photos were attached to the incident report
   - Includes clickable thumbnails that expand to full-size photos

**Chat Interface Component:**

**Message Structure:**
```
┌─────────────────────────────────────────┐
│ [Avatar] Message Text                   │
│              Timestamp                  │
└─────────────────────────────────────────┘
```

**Message Types:**
- **System Messages:** Gray background, system icon (e.g., "Dispute filed", "Supervisor Edited time", "GPS Data", "Worker Rejected")
- **User Messages:** White background, user avatar, role badge (Borrower/Lender)

**Note:** Settlement Offer buttons and Legal Hold buttons have been removed. Resolution is achieved through chat communication between Lending Admin and Borrowing Admin, followed by Super Admin processing the resolution based on chat agreement. Super Admin has read-only access to all evidence (GPS logs, photos, chat history) via the Super Admin dashboard (see Epic 7.9).

**Real-Time Updates:**
- **WebSocket Connection:** Real-time message delivery
- **Typing Indicators:** Shows when other party is typing
- **Read Receipts:** Shows message read status
- **Notification Badge:** Unread message count in dispute list
- **Auto-Scroll:** Chat automatically scrolls to latest message

**Error Handling:**
- **Message Send Failure:** Toast notification with retry button
- **Network Error:** Connection status indicator, auto-reconnect
- **File Upload Failure:** Error message with file size/type requirements

**Accessibility:**
- **Keyboard Navigation:** Tab through messages, Enter to send
- **Screen Reader:** Announces new messages and system-injected evidence
- **Focus Management:** Focus moves to new messages, maintains chat focus
- **ARIA Labels:** All interactive elements properly labeled

**Responsive Behavior:**
- **Desktop:** Single-panel chat interface (full-width)
- **Tablet:** Single-panel chat interface (full-width)
- **Mobile:** Full-screen chat interface

---

## Cross-Cutting UI Elements

This section documents UI elements that appear across multiple screens and contexts, ensuring consistency throughout the application.

### Global Navigation Elements

**Sidebar Navigation:**
- **Current Company Display:** Shows current company name (from login-time resolution, read-only)
- **Notification Badge:** Displays unread notification count on notification icon
- **User Profile Menu:** Access to user settings, profile, and logout
- **Note:** Company context is determined at login time. To switch companies, users must log out and log back in.

**Breadcrumbs:**
- Display current page location within navigation hierarchy
- Clickable breadcrumb items for navigation
- Visible on desktop, hidden on mobile (replaced by page title)

**Page Headers:**
- Consistent page title styling (H1, 32px)
- Action buttons aligned right (primary actions)
- Secondary actions in dropdown menu
- Back button on mobile for nested pages

### Shared Notification Components

**Toast Notifications:**
- **Success Toast:** Green background, checkmark icon, auto-dismiss after 3 seconds
- **Error Toast:** Red background, error icon, manual dismiss required
- **Warning Toast:** Yellow background, warning icon, auto-dismiss after 5 seconds
- **Info Toast:** Blue background, info icon, auto-dismiss after 4 seconds
- **Position:** Top-right on desktop, top-center on mobile
- **Stacking:** Multiple toasts stack vertically with spacing

**In-App Notifications:**
- **Notification Center:** Dropdown panel accessible from notification icon
- **Notification List:** Chronological list of notifications with read/unread states
- **Notification Types:** Booking updates, verification requests, payment notifications, system alerts
- **Actions:** Mark as read, dismiss, navigate to related content

**Banner Alerts:**
- **Info Banner:** Blue background, persistent until dismissed
- **Warning Banner:** Yellow background, persistent until dismissed
- **Error Banner:** Red background, persistent until dismissed
- **Position:** Top of page content, below navigation
- **Use Cases:** Insurance expiration warnings, payment failures, system maintenance

### Common Form Patterns

**Form Layout:**
- **Label Position:** Above input fields (not inline)
- **Required Field Indicator:** Red asterisk (*) after label
- **Error Messages:** Red text below input, associated with input via `aria-describedby`
- **Help Text:** Gray text below input for guidance
- **Field Spacing:** 24px vertical spacing between form fields

**Input States:**
- **Default:** Gray border, white background
- **Focus:** Primary blue border (2px), subtle shadow
- **Error:** Red border, red error message below
- **Disabled:** Gray background, gray text, cursor not-allowed
- **Read-only:** Gray background, no border, cursor default

**Form Actions:**
- **Primary Button:** Right-aligned, primary blue background
- **Secondary Button:** Right-aligned, outlined style, to left of primary
- **Cancel Link:** Left-aligned, gray text, no background
- **Button Spacing:** 16px between action buttons

### Reusable Status Indicators

**Status Badges:**
- **Success:** Green background (#10B981), white text, rounded pill shape
- **Warning:** Yellow background (#F59E0B), dark text, rounded pill shape
- **Error:** Red background (#EF4444), white text, rounded pill shape
- **Info:** Blue background (#3B82F6), white text, rounded pill shape
- **Neutral:** Gray background (#6B7280), white text, rounded pill shape
- **Size:** Small (12px font) for inline use, Medium (14px font) for cards

**Status Icons:**
- **Checkmark:** Green circle with white checkmark (verified, completed)
- **Warning:** Yellow triangle with exclamation (pending, attention needed)
- **Error:** Red circle with X (failed, rejected)
- **Info:** Blue circle with "i" (information, in progress)
- **Clock:** Gray circle with clock icon (pending, scheduled)

**Progress Indicators:**
- **Linear Progress Bar:** Horizontal bar showing completion percentage
- **Circular Progress Spinner:** Loading state for async operations
- **Step Indicator:** Multi-step process visualization (e.g., checkout flow)
- **Color:** Primary blue for active, gray for completed, light gray for pending

### Shared Modal Patterns

**Modal Structure:**
- **Backdrop:** Semi-transparent black overlay (rgba(0, 0, 0, 0.5))
- **Modal Container:** White background, rounded corners (8px), centered on screen
- **Header:** Title (H3, 20px), close button (X icon) top-right
- **Body:** Scrollable content area with padding (24px)
- **Footer:** Action buttons (primary right, secondary left), padding (16px)

**Modal Sizes:**
- **Small:** 400px width (confirmations, simple forms)
- **Medium:** 600px width (standard forms, detail views)
- **Large:** 800px width (complex forms, multi-step processes)
- **Full Screen:** Mobile-only, full viewport height

**Modal Interactions:**
- **Close on Backdrop Click:** Enabled for non-critical modals
- **Close on Escape Key:** Always enabled
- **Focus Trap:** Keyboard focus trapped within modal
- **Focus Return:** Focus returns to trigger element on close

---

## Component Library Structure

### Recommended Component Organization

```
components/
├── layout/
│   ├── Sidebar.tsx
│   ├── SidebarHeader.tsx
│   ├── NavigationItem.tsx
│   └── MainContent.tsx
├── cards/
│   ├── DashboardCard.tsx
│   ├── WorkerCard.tsx
│   ├── BookingCard.tsx
│   └── VerificationCard.tsx
├── forms/
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   └── Button.tsx
├── feedback/
│   ├── Toast.tsx
│   ├── Modal.tsx
│   └── Spinner.tsx
└── data-display/
    ├── Badge.tsx
    ├── StatusIndicator.tsx
    └── Timeline.tsx
```

---

## Next Steps

This front-end specification will inform:
1. **Component Development:** Implementation of reusable components
2. **Styling System:** CSS/Tailwind configuration
3. **State Management:** Component state and data flow
4. **Testing:** Component and integration tests

---

## Related Documentation

- [Navigation Structure](./navigation-structure.md) - Navigation architecture
- [UX Analysis](./ux-analysis.md) - User personas and flows
- [UI Design Goals](../prd/ui-design-goals.md) - Design principles
- [Tech Stack](../architecture/tech-stack.md) - Technology choices
