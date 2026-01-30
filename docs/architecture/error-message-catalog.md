# Error Message Catalog

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Centralized catalog of all user-facing error messages across the SmartBench platform. This document serves as the single source of truth for error messages to ensure consistency across all features and epics.

**Related Documentation:**
- [Error Handling & Resilience Blueprint](./blueprints/system/error-handling.md) - Technical error handling patterns and implementation
- [API Contracts](./api-contracts.md) - API error response format and HTTP status codes

---

## Error Message Standards

**Principles:**
- **User-friendly language** - No technical jargon or internal error codes visible to users
- **Actionable guidance** - Tell users what they should do to resolve the issue
- **Appropriate tone** - Not blaming the user, helpful and supportive
- **Consistent format** - Same error scenarios use the same messages across the platform
- **Context-aware** - Include relevant details when helpful (e.g., available balance, worker name)

**Error Response Format:**
```typescript
{
  error: {
    code: string;        // Machine-readable error code (for developers/logging)
    message: string;     // User-friendly error message (from this catalog)
    userHint?: string;  // Optional additional guidance
    details?: any;       // Additional context for debugging (not shown to users)
  }
}
```

---

## Authentication & Authorization Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `AUTH_REQUIRED` | "Please log in to continue." | Authentication token missing |
| `AUTH_INVALID` | "Your session has expired. Please log in again." | Invalid or expired token |
| `AUTH_INSUFFICIENT_PERMISSIONS` | "You don't have permission to perform this action." | Insufficient permissions |
| `ACCOUNT_LOCKED` | "Account temporarily locked due to multiple failed login attempts. Please try again in [X] minutes or reset your password." | Too many failed login attempts |
| `SESSION_EXPIRED` | "Your session has expired. Please log in again." | Authentication token expired |
| `INVALID_MAGIC_LINK` | "This invitation link has expired or is invalid. Please contact your company admin for a new invitation." | Magic link expired or invalid |

---

## Validation Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `VALIDATION_ERROR` | "Please check your input and try again." | General validation failure |
| `INVALID_DATE_RANGE` | "End date must be on or after start date." | Invalid date range (end_date < start_date) |
| `INVALID_CURRENCY` | "Currency mismatch. Please select a valid currency." | Currency mismatch or invalid currency code |
| `INVALID_RATE` | "Invalid rate. Please enter a valid hourly rate between $0.01 and $999.99." | Rate validation error |
| `PROFILE_VALIDATION_FAILURE` | "Please complete all required fields: [list of missing fields]." | Profile incomplete |
| `INVALID_SEARCH_PARAMETERS` | "Invalid search parameters. Please check your filters." | Search parameters invalid |

---

## Booking & Marketplace Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `BOOKING_CONFLICT` | "This worker is no longer available for the selected dates. Please choose different dates." | Worker already booked |
| `WORKER_UNAVAILABLE` | "Worker [Name] is no longer available. Please remove from cart." | Worker booked by another borrower |
| `INVALID_CART_STATE` | "Cart contains invalid items. Please remove and try again." | Cart contains invalid data (e.g., invalid booking dates, unavailable workers) |
| `PROJECT_SELECTION_REQUIRED` | "Project selection is required. Please select or create a project to continue." | Project not selected during checkout |
| `SITE_CONTACT_REQUIRED` | "Site contact selection is required. Please select a primary site contact to continue." | Site contact not selected during checkout |
| `INSURANCE_EXPIRED` | "Worker's insurance has expired. Please contact the lender to update insurance." | Insurance policy expired |
| `INSURANCE_GATE_FAILED` | "Worker's insurance does not meet requirements. Please contact the lender to update insurance." | Insurance validation failed (3-day gate) |

---

## Payment & Financial Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `PAYMENT_FAILED` | "Payment could not be processed. Please check your payment method and try again." | Stripe payment intent failed |
| `PAYMENT_RETRY_FAILED` | "Weekly payment retry failed. Please update your payment method to avoid worker release." | Weekly payment retry failed. Booking status remains `Active` (no status change). If payment is not resolved by Wednesday 11:59 PM, worker will be released. **Note:** This is for payment failure, NOT dispute-related. Disputes do NOT block clock-in. |
| `PAYMENT_SUCCESS_DISPUTE_ACTIVE` | "Payment successful. Your booking remains paused due to an active dispute. Please resolve the dispute to resume normal operations." | Payment retry succeeded during active Option A dispute (status = `Payment_Paused_Dispute`). Payment is accepted and funds added to escrow, but booking status remains `Payment_Paused_Dispute` until all disputes are resolved. **Note:** This message is shown when payment succeeds but dispute remains active. |
| `PAYMENT_RETRY_DISPUTE_ACTIVE` | "Payment retry is available, but your booking remains paused due to an active dispute. Payment success will not resolve the dispute - you must resolve the dispute separately to resume normal operations." | Payment retry button shown during active Option A dispute. Informs user that payment success does not resolve dispute. |
| `PAYMENT_METHOD_DECLINED` | "Your payment method was declined. Please update your payment method and try again." | Payment method declined by card issuer |
| `INSUFFICIENT_BALANCE` | "Insufficient funds. Available balance: $X.XX. Please adjust withdrawal amount." | Withdrawal exceeds available Stripe Connected Account balance |
| `REFUND_PROCESSING_FAILURE` | "Refund processing failed. Please try again or contact support. Your refund request has been recorded." | Refund processing error |
| `INVALID_REFUND_REQUEST` | "This booking cannot be refunded. [Reason]. Please contact support if you believe this is an error." | Refund request invalid |
| `REFUND_CALCULATION_FAILED` | "Unable to calculate refund. Please contact support." | Refund calculation error |
| `CARD_REFUND_FAILURE` | "Card refund failed. Please contact support. Your refund request has been recorded and will be processed manually." | Card refund error - refund will be processed manually via Stripe |

---

## Time Tracking & Fulfillment Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `GPS_CAPTURE_FAILED` | "Unable to capture your location. You can still clock in. Supervisor will verify your time based on their physical presence." | GPS capture failed or unavailable |
| `PHOTO_UPLOAD_FAILURE` | "Photo upload failed. Please try again or clock in without photo (supervisor approval required)." | Photo upload error during clock-in |
| `CLOCK_IN_CONFLICT` | "You are already clocked in for another shift. Please clock out first." | Overlapping shift detected |
| `CLOCK_OUT_WITHOUT_CLOCK_IN` | "No active shift found. Please clock in first." | Attempted clock-out without active shift |
| `OFFLINE_SYNC_FAILURE` | "Sync failed. Your time has been saved. Please contact support if this persists." | Offline time log sync error |
| `VERIFICATION_TIMEOUT` | "Timesheet verification timed out. Funds will be released automatically 4 hours after clock-out." | Auto-approval triggered |
| `VERIFICATION_TOKEN_EXPIRED` | "Your verification link has expired. A new link has been sent to your phone." | Supervisor verification token expired |
| `FUND_RELEASE_FAILURE` | "Verification successful, but fund release failed. Please contact support. Your verification has been recorded." | Fund release error after verification |
| `DRAFT_SUBMISSION_FAILED` | "Unable to submit timesheet. Please try again." | Draft timesheet submission error |
| `DRAFT_EDIT_LOCKED` | "Timesheet has been submitted and cannot be edited. Please contact supervisor if changes are needed." | Attempt to edit timesheet after submission (no longer in Draft Mode) |
| `TIMESHEET_EDIT_INVALID_STATUS` | "Cannot edit timesheet in current status. Please wait for supervisor review or contact support." | Attempt to edit timesheet in invalid status (e.g., Verified, Disputed) |

## Negotiation Loop Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `TIMESHEET_EDIT_NOT_ALLOWED` | "Cannot edit timesheet in [Status]. [Context-specific message]." | Worker attempts to edit in Pending_Verification, or edit attempted on Verified timesheet |
| `SUPERVISOR_NOTE_REQUIRED` | "You must add a note when editing time. Please provide an explanation for the time change." | Supervisor edits time without note |
| `WORKER_COMMENT_REQUIRED` | "You must enter a comment when rejecting the supervisor's edit. Please explain why you disagree." | Worker rejects edit without comment |
| `TIMESHEET_VERIFIED_LOCKED` | "This timesheet has been verified and funds have been released. It cannot be edited. Please create a correction entry instead." | Attempt to edit Verified timesheet |

---

## Dispute & Resolution Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `DISPUTE_CREATION_FAILURE` | "Unable to create dispute. Please try again or contact support." | Dispute creation error |
| `DISPUTE_OPTION_REQUIRED` | "You must select an option before filing the dispute. Choose 'Dispute Shift Only' to continue the booking or 'End Booking & Dispute' to terminate." | Dispute filed without selecting Option A or Option B |
| `DISPUTE_OPTION_INVALID` | "Invalid dispute option. Please select either 'Dispute Shift Only' (Option A) or 'End Booking & Dispute' (Option B)." | Invalid disputeOption value provided |
| `DISPUTE_ALREADY_EXISTS` | "A dispute already exists for this timesheet. Please resolve the existing dispute first." | Attempt to file duplicate dispute |
| `DISPUTE_TIMESHEET_VERIFIED` | "This timesheet has already been verified and cannot be disputed. Disputes must be filed within 4 hours of clock-out." | Dispute filed after auto-approval or manual verification |
| `DISPUTE_BOOKING_CANCELLED` | "Booking is already cancelled. Cannot file dispute on cancelled booking." | Dispute (Option A or Option B) filed on already-cancelled booking |
| `DISPUTE_BOOKING_INVALID_STATUS` | "Cannot file dispute. Booking status does not allow disputes. [Reason]." | Dispute filed on booking with invalid status (e.g., Completed, Pending_Payment) |

---

## Financial & Withdrawal Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `KYC_VERIFICATION_REQUIRED` | "Identity verification required before withdrawal. Please complete verification to continue." | KYC not completed |
| `KYC_VERIFICATION_FAILED` | "Identity verification failed. Please try again or contact support." | KYC verification error |
| `WITHDRAWAL_PROCESSING_FAILURE` | "Withdrawal processing failed. Your funds are safe. Please try again or contact support." | Withdrawal processing error |
| `BANK_ACCOUNT_NOT_CONNECTED` | "Bank account not connected. Please connect your bank account to withdraw funds." | Bank account setup required |

---

## Search & Availability Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `SEARCH_SERVICE_UNAVAILABLE` | "Search service temporarily unavailable. Please try again in a few moments." | Database unavailable or PostgreSQL extensions missing |
| `SEARCH_EXTENSION_MISSING` | "Search service is temporarily unavailable. Please try again in a few moments." | Required PostgreSQL extensions (pg_trgm, earthdistance/postgis) not installed. **HTTP Status:** `503 Service Unavailable` |
| `SEARCH_EXTENSION_PARTIAL` | "Search service is temporarily unavailable. Please try again in a few moments." | Partial extension failure (e.g., `pg_trgm` installed but `earthdistance`/`postgis` missing). **HTTP Status:** `503 Service Unavailable` (if all extensions unavailable) or `200 OK` with degraded results (if partial failure - text search works, geo search disabled) |
| `SEARCH_EXTENSION_RUNTIME_UNAVAILABLE` | "Search service temporarily unavailable. Please try again in a few moments." | Extension became unavailable during runtime (not just at startup) - may indicate database configuration issue. **HTTP Status:** `503 Service Unavailable` |
| `SEARCH_GEO_UNAVAILABLE` | "Location-based search is temporarily unavailable. Please try again in a few moments." | Geo extension (`earthdistance` or `postgis`) unavailable - text search may still work. **HTTP Status:** `200 OK` with degraded results (text-only search, no geo filtering) or `503 Service Unavailable` (if text extension also unavailable) |
| `NO_SEARCH_RESULTS` | "No workers found matching your criteria. Try adjusting your filters or search terms." | Search returned no results |
| `SEARCH_TIMEOUT` | "Search is taking longer than expected. Please try again with more specific filters." | Search timeout |
| `SEARCH_CONNECTION_POOL_EXHAUSTED` | "Search service is temporarily busy. Please try again in a few moments." | Database connection pool exhausted - all connections in use |
| `SEARCH_REPLICA_LAG_EXCEEDED` | "Search service is temporarily busy. Please try again in a few moments." | Read replica lag exceeds acceptable threshold (>500ms) - queries routed to primary |

---

## Profile & Settings Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `LISTING_TOGGLE_FAILURE` | "Unable to list worker. [Reason]. Please resolve the issue and try again." | Listing toggle error |

---

## System & Network Errors

| Error Code | User Message | Context |
|------------|--------------|---------|
| `NETWORK_ERROR` | "Network error. Please check your connection and try again." | Transient network failure |
| `SERVICE_UNAVAILABLE` | "Service temporarily unavailable. Please try again in a few moments." | Service temporarily down |
| `TIMEOUT_ERROR` | "Request timed out. Please try again." | Request timeout |

---

## Usage Guidelines

### For Developers

1. **Always use error codes from this catalog** - Do not create new error codes without updating this document
2. **Use exact user messages** - Copy the user message exactly as specified to ensure consistency
3. **Include context in details** - Use the `details` field for debugging information, not the user message
4. **Update this catalog** - When adding new error scenarios, add them to this catalog first

### For Product/Design

1. **Review new error messages** - Ensure new messages follow the principles above
2. **Test error scenarios** - Verify error messages are shown correctly in UI
3. **Gather user feedback** - Update messages based on user confusion or feedback

---

## Related Epic Documentation

Error messages are referenced in the following epic documents:
- [Epic 1: Identity & Onboarding](../prd/epic-1.md) - Authentication, profile, insurance errors
- [Epic 2: Marketplace & Search](../prd/epic-2.md) - Search, availability, cart errors
- [Epic 4: Booking Creation](../prd/epic-4.md) - Booking, project, supervisor errors
- [Epic 5: Time Tracking](../prd/epic-5.md) - Clock-in/out, GPS, verification errors
- [Epic 6: Payments & Refunds](../prd/epic-6.md) - Payment and refund errors
- [Epic 7: Disputes & Resolution](../prd/epic-7.md) - Dispute errors

---

**Last Reviewed:** January 2026  
**Next Review:** When adding new error scenarios or receiving user feedback on error messages
