# API Contracts

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Formal API contract documentation for the SmartBench platform, including request/response schemas, authentication requirements, error formats, and rate limiting.

This document provides the API contract specifications for all REST endpoints. For implementation details and code examples, see the [Architecture Blueprints](./blueprints/).

---

## Table of Contents

- [Authentication](#authentication)
- [Standard Response Formats](#standard-response-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints by Domain](#api-endpoints-by-domain)
- [OpenAPI Specification](#openapi-specification)

---

## Authentication

### Authentication Method

All API endpoints (except authentication endpoints) require JWT Bearer token authentication.

**Header Format:**
```
Authorization: Bearer <access_token>
```

### Token Types

- **Access Token:** Short-lived (24 hours), used for API requests
- **Refresh Token:** Long-lived (7 days), used to obtain new access tokens

### Authentication Endpoints

**POST /api/auth/login**
- **Authentication:** None (public endpoint)
- **Rate Limit:** 5 requests per minute per IP
- **Request Body:**
  ```json
  {
    "identifier": "user@example.com",
    "password": "securePassword123"
  }
  ```
  - `identifier`: Email address or mobile number (phone-first authentication)
- **Success Response (200):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "mobileNumber": "+1234567890",
      "email": "user@example.com",
      "userState": "Listed"
    },
    "companies": [
      {
        "id": "uuid",
        "name": "Company Name",
        "roles": ["Admin", "Manager", "Supervisor", "Worker"]
      }
    ]
  }
  ```
  - Note: `email` may be null for workers (phone-first authentication)
- **Error Responses:**
  - `401 Unauthorized`: Invalid credentials
  - `403 Forbidden`: No active company memberships
  - `429 Too Many Requests`: Rate limit exceeded

**POST /api/auth/refresh**
- **Authentication:** None (public endpoint)
- **Rate Limit:** 10 requests per minute per IP
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Success Response (200):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Refresh token required
  - `403 Forbidden`: Invalid or expired refresh token

**POST /api/auth/logout**
- **Authentication:** Bearer token required
- **Rate Limit:** 10 requests per minute per user
- **Request Body:** None
- **Success Response (200):**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

## Standard Response Formats

### Success Response

All successful API responses follow this structure:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination Response

Paginated endpoints include pagination metadata:

```json
{
  "data": [ ... ],
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

**Query Parameters for Pagination:**
- `page` (integer, default: 1): Page number
- `pageSize` (integer, default: 20, max: 100): Items per page

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "userHint": "User-friendly guidance on how to resolve the error",
    "details": { ... } // Optional: Additional error context
  },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

- **200 OK:** Request successful
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request parameters or body
- **401 Unauthorized:** Authentication required or failed
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Resource conflict (e.g., duplicate booking, payment in progress)
- **422 Unprocessable Entity:** Validation error or business rule violation
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error
- **502 Bad Gateway:** External service unavailable (e.g., Stripe API)
- **503 Service Unavailable:** Service temporarily unavailable

### Error Codes

**Authentication Errors:**
- `AUTH_REQUIRED`: Authentication token required
- `AUTH_INVALID`: Invalid or expired token
- `AUTH_INSUFFICIENT_PERMISSIONS`: User lacks required permissions

**Validation Errors:**
- `VALIDATION_ERROR`: Request validation failed
- `INVALID_DATE_RANGE`: Invalid date range (end_date < start_date)
- `INVALID_CURRENCY`: Currency mismatch or invalid currency code

**Business Logic Errors:**
- `BOOKING_CONFLICT`: Worker already booked for date range
- `PAYMENT_METHOD_DECLINED`: Payment method declined by card issuer
- `INSURANCE_GATE_FAILED`: Insurance validation failed (3-day gate)
- `PAYMENT_FAILED`: Payment processing failed
- `PAYMENT_RETRY_FAILED`: Weekly payment retry failed (hard cutoff not yet reached)
- `REFUND_CALCULATION_FAILED`: Refund calculation error (invalid booking status or dates)
- `SITE_CONTACT_REQUIRED`: Primary Site Contact selection required before payment processing
- `TAX_EXEMPTION_INVALID`: Tax exemption validation failed *(Post-MVP - tax exemption functionality deferred)*
- `WEEKLY_PAYMENT_NOT_ELIGIBLE`: Booking not eligible for weekly payment retry

**Resource Errors:**
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RESOURCE_CONFLICT`: Resource conflict (e.g., duplicate active insurance policy)

**External Service Errors:**
- `STRIPE_API_UNAVAILABLE`: Stripe payment service temporarily unavailable

---

## Rate Limiting

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

### Rate Limit Policies

**Authentication Endpoints:**
- **Login:** 5 requests per minute per IP address
- **Refresh Token:** 10 requests per minute per IP address
- **Logout:** 10 requests per minute per authenticated user

**Standard API Endpoints:**
- **General API:** 100 requests per minute per authenticated user
- **Financial Operations:** 10 requests per minute per user (stricter limits)
- **Search Endpoints:** 30 requests per minute per user (separate from general API rate limiting)
  - Search rate limiting is independent of general API rate limiting
  - Rate limit exceeded returns `429 Too Many Requests` with appropriate `Retry-After` header
  - Consider dynamic rate limiting during extension failures (reduce limits to prevent overload during degraded state)
- **Webhook Endpoints:** 1000 requests per minute per webhook source

### Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

**Status:** `429 Too Many Requests`

**Response Body:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "userHint": "Please wait before making another request",
    "details": {
      "retryAfter": 60
    }
  },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Headers:**
```
Retry-After: 60
```

---

## API Endpoints by Domain

> **Note:** This document covers the core API endpoints for MVP. Additional endpoints for Epic 2 (Worker Profile Management, Roster Invites, Insurance Verification) and Epic 7 (Super Admin Dashboard) will be added in future updates as those epics are implemented. For now, these features may be accessed through existing Identity Domain endpoints or will be documented separately.

### Identity Domain

This section documents the **Identity domain** API endpoints for user authentication, profile management, and company operations.

**GET /api/users/me**
- **Authentication:** Bearer token required
- **Authorization:** Any authenticated user
- **Rate Limit:** 100 requests/minute
- **Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "email": "user@example.com", // Optional: may be null for Workers (phone-first authentication)
      "mobileNumber": "+1234567890", // Required for Workers, optional for non-Workers
      "userState": "Listed",
      "preferences": {
        "timezone": "America/Chicago",
        "quietHoursStart": "22:00",
        "quietHoursEnd": "06:00"
      }
    }
  }
  ```

**PUT /api/users/me**
- **Authentication:** Bearer token required
- **Authorization:** Any authenticated user
- **Rate Limit:** 20 requests/minute
- **Request Body:**
  ```json
  {
    "email": "user@example.com", // Optional: may be null for Workers (phone-first authentication)
    "mobileNumber": "+1234567890", // Required for Workers, optional for non-Workers
    "preferences": {
      "timezone": "America/Chicago",
      "quietHoursStart": "22:00",
      "quietHoursEnd": "06:00"
    }
  }
  ```
- **Response (200):** Same structure as GET /api/users/me

**GET /api/companies/{companyId}**
- **Authentication:** Bearer token required
- **Authorization:** Company member (any role)
- **Rate Limit:** 100 requests/minute
- **Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "Company Name",
      "ein": "12-3456789",
      "defaultCurrency": "USD",
      "strikesCount": 0,
      "minBillableHours": 4
    }
  }
  ```

### Project Domain

**POST /api/projects**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin role required (borrower company)
- **Rate Limit:** 20 requests/minute
- **Request Body:**
  ```json
  {
    "name": "Project Name",
    "address": {
      "street": "123 Main St",
      "city": "Minneapolis",
      "state": "MN",
      "zipCode": "55401"
    },
    "timezone": "America/Chicago"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "Project Name",
      "address": { ... },
      "timezone": "America/Chicago",
      "companyId": "uuid",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  }
  ```

**GET /api/projects**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin role required (borrower company)
- **Rate Limit:** 100 requests/minute
- **Query Parameters:**
  - `page` (integer, default: 1)
  - `pageSize` (integer, default: 20, max: 100)
  - `search` (string, optional): Search by project name
- **Response (200):**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Project Name",
        "address": { ... },
        "timezone": "America/Chicago",
        "bookingsCount": 5,
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ],
    "meta": {
      "pagination": { ... }
    }
  }
  ```

**PUT /api/projects/{projectId}**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin role required (borrower company, project owner)
- **Rate Limit:** 20 requests/minute
- **Request Body:**
  ```json
  {
    "name": "Updated Project Name",
    "address": {
      "street": "456 Oak Ave",
      "city": "St. Paul",
      "state": "MN",
      "zipCode": "55101"
    },
    "timezone": "America/Chicago"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "Updated Project Name",
      "address": { ... },
      "timezone": "America/Chicago",
      "updatedAt": "2026-01-15T11:00:00Z"
    }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: User not authorized to update this project
  - `404 Not Found`: Project not found

### Booking Domain

**POST /api/bookings**
- **Authentication:** Bearer token required
- **Authorization:** Admin or Manager role required (Borrower context)
- **Rate Limit:** 10 requests/minute
- **Request Body:**
  ```json
  {
    "projectId": "uuid",
    "workerId": "uuid",
    "lenderCompanyId": "uuid",
    "startDate": "2026-01-20",
    "endDate": "2026-01-27",
    "paymentType": "Full_Upfront",
    "primarySiteContactId": "uuid",
    "currencyCode": "USD"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Pending_Payment",
      "paymentIntentId": "pi_xxx",
      "checkoutUrl": "https://checkout.stripe.com/..."
    }
  }
  ```

**GET /api/bookings/{bookingId}**
- **Authentication:** Bearer token required
- **Authorization:** Company member (booking participant)
- **Rate Limit:** 100 requests/minute
- **Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Active", // Possible values: 'Pending_Payment', 'Confirmed', 'Active', 'Suspended_Insurance', 'Disputed', 'Payment_Paused_Dispute', 'Completed', 'Cancelled'
      // Note: 'Payment_Paused_Dispute' = weekly payment paused due to Option A dispute. Booking remains Active, workers CAN clock in.
      "project": { ... },
      "worker": { ... },
      "startDate": "2026-01-20",
      "endDate": "2026-01-27",
      "paymentType": "Full_Upfront",
      "fundedPeriodEnd": "2026-01-27"
    }
  }
  ```
- **Note:** Booking status values include `Payment_Paused_Dispute` (weekly payment paused due to Option A dispute, does NOT block clock-in, booking remains Active), and `Suspended_Insurance` (insurance expired/revoked, triggered by compliance events independent of payment processing). Payment failures do not change booking status - booking remains `Active` until hard cutoff (Wednesday 11:59 PM) when worker is released. See [Booking Status State Machine](./data-dictionary-booking.md#booking-status-state-machine) for complete status definitions and transitions.

**POST /api/timesheets/{timesheetId}/dispute**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin (Borrower context) required
- **Rate Limit:** 5 requests/minute
- **Description:** File a dispute for a timesheet. **CRITICAL:** The supervisor MUST select Option A or Option B in the "Fork in the Road" modal before the dispute can be filed. This selection is mandatory and cannot be deferred.
- **Request Body:**
  ```json
  {
    "disputeOption": "Option_A" | "Option_B", // REQUIRED: Must be "Option_A" (Dispute Shift Only) or "Option_B" (End Booking & Dispute)
    "reason": "Hours discrepancy", // Optional: Dispute reason text
    "evidence": [] // Optional: Array of evidence file URLs
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "disputeId": "uuid",
      "timesheetId": "uuid",
      "bookingId": "uuid",
      "disputeOption": "Option_A",
      "bookingStatus": "Active", // Option A: Remains Active, Option B: Immediately Cancelled
      "fundsFrozen": true,
      "disputeResolutionChatId": "uuid"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity`: `disputeOption` not provided (must be "Option_A" or "Option_B"). Error code: `DISPUTE_OPTION_REQUIRED`. Error message: "You must select an option before filing the dispute. Choose 'Dispute Shift Only' to continue the booking or 'End Booking & Dispute' to terminate."
  - `400 Bad Request`: Dispute cannot be filed (timesheet already verified/auto-approved, or outside 4-hour window). Error message: "This timesheet has already been verified and cannot be disputed. Disputes must be filed within 4 hours of clock-out."
  - `403 Forbidden`: Insufficient permissions to file dispute
  - `404 Not Found`: Timesheet not found
  - `409 Conflict`: Dispute already exists for this timesheet. Error message: "A dispute already exists for this timesheet. Please resolve the existing dispute first."
  - `422 Unprocessable Entity`: Invalid dispute option or timesheet not eligible for dispute. Error code: `DISPUTE_OPTION_INVALID`. Error message: "Invalid dispute option. Please select either 'Dispute Shift Only' (Option A) or 'End Booking & Dispute' (Option B)."
- **Edge Cases:**
  - **Option B Dispute on Already-Cancelled Booking:** If booking is already `Cancelled` (e.g., from previous Option B dispute or manual cancellation), Option B dispute filing returns `409 Conflict` with error code: `DISPUTE_BOOKING_CANCELLED` and message: "Booking is already cancelled. Cannot file dispute on cancelled booking." **Note:** Option A disputes also cannot be filed on cancelled bookings - the booking must be in `Active` or a valid status (e.g., `Suspended_Insurance`, `Payment_Paused_Dispute`) to file a dispute.

**POST /api/incidents**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin (Borrower context) required
- **Rate Limit:** 5 requests/minute
- **Description:** File an incident report for "End for Cause" termination. **CRITICAL:** The supervisor MUST select Option A or Option B in the "Fork in the Road" modal before the incident report can be filed. This selection is mandatory and cannot be deferred.
- **Request Body:**
  ```json
  {
    "bookingId": "uuid",
    "shiftId": "uuid", // Optional: Current shift ID if incident occurred during active shift
    "disputeOption": "Option_A" | "Option_B", // REQUIRED: Must be "Option_A" (Dispute Shift Only) or "Option_B" (End Booking & Dispute)
    "incidentDescription": "Safety violation occurred", // Required: Text description of incident
    "photos": [], // Optional: Array of photo file URLs
    "workerNotified": true // Required: Confirmation that supervisor notified worker in person
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "incidentId": "uuid",
      "bookingId": "uuid",
      "disputeOption": "Option_B",
      "bookingStatus": "Cancelled", // Option A: Remains Active, Option B: Immediately Cancelled
      "fundsFrozen": true,
      "disputeResolutionChatId": "uuid"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity`: `disputeOption` not provided (must be "Option_A" or "Option_B"). Error code: `DISPUTE_OPTION_REQUIRED`. Error message: "You must select an option before filing the incident report. Choose 'Dispute Shift Only' to continue the booking or 'End Booking & Dispute' to terminate."
  - `400 Bad Request`: `workerNotified` is false (supervisor must confirm verbal notification before system action). Error message: "You must confirm that the worker has been notified in person before filing an incident report."
  - `403 Forbidden`: Insufficient permissions to file incident report
  - `404 Not Found`: Booking not found
  - `422 Unprocessable Entity`: Invalid incident data or booking not eligible for incident report. Error message: "Invalid dispute option. Please select either 'Dispute Shift Only' (Option A) or 'End Booking & Dispute' (Option B)."
- **Edge Cases:**
  - **Option B Incident Report on Already-Cancelled Booking:** If booking is already `Cancelled`, Option B incident report returns `409 Conflict` with message: "Booking is already cancelled. Cannot file Option B incident report on cancelled booking."
  - **Option A Incident Report:** Booking remains `Active`, worker can clock in for future shifts, only current shift funds frozen in Stripe Escrow (Stripe hold for disputes).
  - **Option B Incident Report:** Booking immediately transitions to `Cancelled`, worker released, total freeze (current shift + cancellation penalty) held in Stripe Escrow (Stripe hold for disputes).

**POST /api/bookings/{bookingId}/cancel**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin or Manager (borrower context) required, or Company Admin (lender context)
- **Rate Limit:** 5 requests/minute
- **Request Body:**
  ```json
  {
    "reason": "Project cancelled",
        "refundDestination": "CreditCard" // All refunds go directly to customer's payment method via Stripe API
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Cancelled",
      "refundAmount": 50000, // cents (refunded to payment method via Stripe API)
      "refundDestination": "CreditCard" // All refunds go directly to payment method
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid cancellation reason or booking not cancellable
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Booking not found
  - `409 Conflict`: Booking has active disputes
  - `422 Unprocessable Entity`: Cancellation validation failed
  - `502 Bad Gateway`: Payment processing service unavailable

**PUT /api/bookings/{bookingId} {#put-apibookingsbookingid}**
- **Authentication:** Bearer token required
- **Authorization:** Admin or Manager (Borrower context) required
- **Rate Limit:** 10 requests/minute
- **Behavior:** Updates booking fields, including primary site contact
  - Site Contact changes are allowed at any time, including during active shifts
  - Worker receives immediate notification when Site Contact is changed
  - Site Contact must be a member of the Borrower Company (enforced at application level)
- **Request Body:**
  ```json
  {
    "primarySiteContactId": "uuid" // Optional: Company member user ID to set as primary site contact
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "data": {
      "id": "uuid",
      "primarySiteContactId": "uuid",
      "primarySiteContact": {
        "id": "uuid",
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid site contact assignment (e.g., user not in borrower company)
  - `403 Forbidden`: Insufficient permissions (not borrower company admin)
  - `404 Not Found`: Booking not found or user not found
  - `422 Unprocessable Entity`: Site contact validation failed (e.g., user not a company member)

**Note:** Site Contact is for operational communication only (gate codes, running late, site access). Verification is role-based - any Supervisor, Manager, or Admin in the Borrower Company can verify timesheets, regardless of Site Contact assignment.

### Fulfillment Domain

**POST /api/time-log/clock-in**
- **Authentication:** Bearer token required
- **Authorization:** Worker role required
- **Rate Limit:** 20 requests/minute
- **Request Body:**
  ```json
  {
    "bookingId": "uuid",
    "gpsCoordinates": {
      "latitude": 44.9778,
      "longitude": -93.2650
    },
    "projectPhoto": "base64_encoded_image"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Working",
      "clockInTime": "2026-01-15T08:00:00Z",
      "bookingId": "uuid"
    }
  }
  ```

**POST /api/time-log/{timeLogId}/clock-out**
- **Authentication:** Bearer token required
- **Authorization:** Worker role required (own time log)
- **Rate Limit:** 20 requests/minute
- **Request Body:**
  ```json
  {
    "gpsCoordinates": {
      "latitude": 44.9778,
      "longitude": -93.2650
    }
  }
  ```

**POST /api/time-log/{timeLogId}/verify**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin role required
- **Rate Limit:** 30 requests/minute
- **Request Body:**
  ```json
  {
    "status": "Verified",
    "notes": "All hours verified"
  }
  ```

**POST /api/timesheets/draft**
- **Authentication:** Bearer token required
- **Authorization:** Worker role required
- **Rate Limit:** 20 requests/minute
- **Description:** Submit draft timesheet (Worker clicks "Submit" after "Stop Work"). This transitions the timesheet from Draft Mode to `Pending_Verification` status and triggers the 4-hour auto-approval timer.
- **Request Body:**
  ```json
  {
    "timeLogId": "uuid",
    "hours": 8.5,
    "breakMinutes": 30,
    "notes": "Optional notes"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Pending_Verification",
      "submittedAt": "2026-01-15T16:00:00Z",
      "autoApprovalAt": "2026-01-15T20:00:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid timesheet data or timesheet already submitted
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Time log not found
  - `422 Unprocessable Entity`: Draft submission validation failed. Error code: `DRAFT_SUBMISSION_FAILED`. Error message: "Unable to submit timesheet. Please try again."

**PUT /api/timesheets/{id}/draft**
- **Authentication:** Bearer token required
- **Authorization:** Worker role required (own timesheet)
- **Rate Limit:** 20 requests/minute
- **Description:** Edit draft timesheet before submission. Only available when timesheet is in Draft Mode (before "Submit" is clicked).
- **Request Body:**
  ```json
  {
    "hours": 8.5,
    "breakMinutes": 30,
    "notes": "Updated notes"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Draft",
      "hours": 8.5,
      "breakMinutes": 30,
      "updatedAt": "2026-01-15T15:30:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid timesheet data
  - `403 Forbidden`: Insufficient permissions or timesheet not in Draft Mode
  - `404 Not Found**: Timesheet not found
  - `422 Unprocessable Entity`: Draft edit locked. Error code: `DRAFT_EDIT_LOCKED`. Error message: "Timesheet has been submitted and cannot be edited. Please contact supervisor if changes are needed."

**GET /api/timesheets/{id}/draft**
- **Authentication:** Bearer token required
- **Authorization:** Worker role required (own timesheet) or Supervisor/Manager/Admin (borrower company)
- **Rate Limit:** 100 requests/minute
- **Description:** Get draft timesheet data. Returns draft data if timesheet is in Draft Mode, or current timesheet data if already submitted.
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Draft",
      "hours": 8.5,
      "breakMinutes": 30,
      "notes": "Draft notes",
      "workerEdited": true,
      "createdAt": "2026-01-15T08:00:00Z",
      "updatedAt": "2026-01-15T15:30:00Z"
    }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found**: Timesheet not found

**PUT /api/timesheets/{id}/supervisor-edit**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin role required (borrower company)
- **Rate Limit:** 30 requests/minute
- **Description:** Supervisor edits timesheet (Step 1 of Negotiation Loop). Only available when timesheet is in `Pending_Verification` status. Supervisor MUST add a note when editing. After this edit, timesheet moves to `Pending_Worker_Review` (Step 2) where worker can accept, reject with comment, or dispute.
- **Request Body:**
  ```json
  {
    "hours": 7.5,
    "breakMinutes": 30,
    "notes": "Supervisor adjusted hours" // REQUIRED when editing
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Pending_Worker_Review",
      "hours": 7.5,
      "breakMinutes": 30,
      "auto_approval_time": "2026-01-15T21:00:00Z",
      "updatedAt": "2026-01-15T17:00:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid timesheet data, timesheet not in valid state for supervisor edit, or note is missing (note is required for edits)
  - `403 Forbidden**: Insufficient permissions
  - `404 Not Found**: Timesheet not found

**POST /api/timesheets/{id}/worker-review**
- **Authentication:** Bearer token required
- **Authorization:** Worker role required (own timesheet)
- **Rate Limit:** 20 requests/minute
- **Description:** Worker reviews supervisor edit (Step 2 of Negotiation Loop). Only available when timesheet is in `Pending_Worker_Review` status. Worker can accept the edit, reject with required comment, or dispute. If rejected, timesheet moves to `Pending_Supervisor_Reevaluation` (Step 3).
- **Request Body:**
  ```json
  {
    "action": "accept" | "reject" | "dispute",
    "comment": "Worker's explanation" // REQUIRED if action is "reject"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Verified" | "Pending_Supervisor_Reevaluation" | "Disputed",
      "action": "accept" | "reject" | "dispute",
      "auto_approval_time": "2026-01-15T21:30:00Z", // Only if status is Pending_Supervisor_Reevaluation
      "updatedAt": "2026-01-15T17:30:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request**: Invalid action, timesheet not in `Pending_Worker_Review` status, or comment missing when action is "reject"
  - `403 Forbidden**: Insufficient permissions
  - `404 Not Found**: Timesheet not found

**POST /api/timesheets/{id}/supervisor-reevaluation**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin role required (borrower company)
- **Rate Limit:** 30 requests/minute
- **Description:** Supervisor re-evaluates after worker rejection (Step 3 of Negotiation Loop). Only available when timesheet is in `Pending_Supervisor_Reevaluation` status. Supervisor can correct time (loops back to Step 2) or file dispute (Impasse).
- **Request Body:**
  ```json
  {
    "action": "correct" | "file_dispute",
    "corrected_data": { // REQUIRED if action is "correct"
      "hours": 8.0,
      "breakMinutes": 30,
      "notes": "Supervisor corrected time based on worker feedback"
    }
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Pending_Worker_Review" | "Disputed",
      "action": "correct" | "file_dispute",
      "auto_approval_time": "2026-01-15T21:30:00Z", // Only if status is Pending_Worker_Review
      "updatedAt": "2026-01-15T18:00:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request**: Invalid action, timesheet not in `Pending_Supervisor_Reevaluation` status, or corrected_data missing when action is "correct"
  - `403 Forbidden**: Insufficient permissions
  - `404 Not Found**: Timesheet not found

**POST /api/timesheets/{id}/approve**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin role required (borrower company) for `Pending_Verification` or `Pending_Supervisor_Reevaluation` status, or Worker role (own timesheet) for `Pending_Worker_Review` status
- **Rate Limit:** 30 requests/minute
- **Description:** Approve timesheet. Can be called at any step of the Negotiation Loop. Approves the timesheet and releases funds.
- **Request Body:**
  ```json
  {
    "notes": "Optional approval notes"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "id": "uuid",
      "status": "Verified",
      "approvedAt": "2026-01-15T18:00:00Z",
      "approvedBy": "uuid"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request**: Timesheet not in valid state for approval
  - `403 Forbidden**: Insufficient permissions
  - `404 Not Found**: Timesheet not found
  - `422 Unprocessable Entity**: Approval validation failed

**POST /api/timesheets/{id}/dispute**
- **Authentication:** Bearer token required
- **Authorization:** Supervisor, Manager, or Admin role required (borrower company) for `Pending_Verification` or `Pending_Supervisor_Reevaluation` status, or Worker role (own timesheet) for `Pending_Worker_Review` status
- **Rate Limit:** 5 requests/minute
- **Description:** File dispute for timesheet. Can be called from `Pending_Verification`, `Pending_Worker_Review`, or `Pending_Supervisor_Reevaluation` (Step 3 - Impasse) status. At Step 3 (Impasse), supervisor can correct time or file dispute. Filing dispute triggers the "Fork in the Road" modal and opens chat-based resolution workflow.
- **Request Body:**
  ```json
  {
    "option": "A" | "B", // REQUIRED: "A" = Dispute Shift Only (Continue Employment), "B" = End Booking & Dispute (Termination)
    "reason": "Hours discrepancy" // Optional
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "disputeId": "uuid",
      "timesheetId": "uuid",
      "status": "Disputed",
      "bookingStatus": "Active" | "Cancelled", // "Active" for Option A, "Cancelled" for Option B
      "disputeResolutionChatId": "uuid", // Chat ID for resolution communication
      "disputedAt": "2026-01-15T18:30:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request**: Timesheet not in valid state for dispute (e.g., already verified or auto-approved), or option not provided
  - `403 Forbidden**: Insufficient permissions
  - `404 Not Found**: Timesheet not found

### Dispute Resolution Domain

This section documents the **Dispute Resolution domain** API endpoints for chat-based dispute resolution with system-injected evidence.

**GET /api/disputes/{disputeId}/chat**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin (Lending or Borrowing company) required
- **Rate Limit:** 100 requests/minute
- **Description:** Get chat messages for dispute resolution. Returns all messages including system-injected evidence messages (GPS data, photos, supervisor edits, worker rejections, etc.). For disputes filed from Negotiation Loop (Step 2 or Step 3), the complete Negotiation Loop history is included as chronological system messages showing all edit/rejection iterations. Evidence is automatically injected by the system when dispute is filed - no separate Evidence Locker UI exists.
- **Response (200):**
  ```json
  {
    "data": {
      "disputeId": "uuid",
      "messages": [
        {
          "id": "uuid",
          "type": "system", // "system" for evidence injection, "user" for admin messages
          "content": "System: Supervisor Edited time to 7.5 hours. Note: Added 30-minute lunch break",
          "timestamp": "2026-01-15T18:00:00Z",
          "senderId": null, // null for system messages
          "senderName": "System"
        },
        {
          "id": "uuid",
          "type": "system",
          "content": "System: Worker Rejected. Comment: I took a 15-minute break, not 30 minutes",
          "timestamp": "2026-01-15T18:05:00Z",
          "senderId": null,
          "senderName": "System"
        },
        {
          "id": "uuid",
          "type": "system",
          "content": "System: GPS Data - [Location Link]",
          "timestamp": "2026-01-15T18:05:00Z",
          "senderId": null,
          "senderName": "System",
          "evidence": {
            "type": "gps",
            "clockInLocation": { "lat": 44.9778, "lng": -93.2650 },
            "clockOutLocation": { "lat": 44.9778, "lng": -93.2650 },
            "mapUrl": "https://maps.example.com/..."
          }
        },
        {
          "id": "uuid",
          "type": "user",
          "content": "I agree. Let's split the difference - 22.5 minutes.",
          "timestamp": "2026-01-15T18:10:00Z",
          "senderId": "uuid",
          "senderName": "Lender Admin",
          "senderRole": "lender"
        }
      ],
      "disputeStatus": "Open",
      "fundsFrozen": true
    }
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Insufficient permissions (not admin of lending or borrowing company)
  - `404 Not Found`: Dispute not found

**POST /api/disputes/{disputeId}/chat/messages**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin (Lending or Borrowing company) required
- **Rate Limit:** 30 requests/minute
- **Description:** Send a message in dispute resolution chat. Only Company Admins (Lending Admin and Borrowing Admin) can send messages. System automatically injects evidence messages - admins cannot send system messages.
- **Request Body:**
  ```json
  {
    "content": "I agree. Let's split the difference - 22.5 minutes."
  }
  ```
- **Success Response (201):**
  ```json
  {
    "data": {
      "messageId": "uuid",
      "disputeId": "uuid",
      "content": "I agree. Let's split the difference - 22.5 minutes.",
      "timestamp": "2026-01-15T18:10:00Z",
      "senderId": "uuid",
      "senderName": "Lender Admin",
      "senderRole": "lender"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Empty message content or invalid content
  - `403 Forbidden`: Insufficient permissions (not admin of lending or borrowing company)
  - `404 Not Found`: Dispute not found
  - `409 Conflict`: Dispute already resolved

**Note:** Evidence injection is automatic and handled by the system when disputes are filed. No separate endpoints exist for uploading evidence to an "Evidence Locker" - all evidence appears as system messages in the chat stream. Super Admin has read-only access to all evidence via the Super Admin dashboard (see Epic 7.9).

### Financial Operations Domain

This section documents the **Financial Operations domain** API endpoints for payment processing, weekly payments, refunds, and financial transaction management.

**POST /api/bookings/{bookingId}/weekly-payment/retry**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin (borrower company) required
- **Rate Limit:** 5 requests/minute
- **Description:** Manually retry failed weekly payment after "Action Required" notification. **Note:** This endpoint does NOT check insurance validity. Insurance validation runs independently via compliance events (nightly monitoring jobs or manual updates). If booking status is `Suspended_Insurance`, payment retry will not be available (booking is suspended for compliance reasons, not payment reasons). **Payment Retry During Active Dispute:** This endpoint is available when booking has active Option A dispute (status = `Payment_Paused_Dispute`). If payment succeeds during active dispute, payment is accepted and funds are added to escrow, but booking status remains `Payment_Paused_Dispute` (not `Active`) until all disputes are resolved. The success response includes a `disputeActive` flag and user message indicating that the dispute must be resolved separately.
- **Request Body:**
  ```json
  {
    "paymentMethodId": "pm_xxx" // Optional: Override default payment method
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "bookingId": "uuid",
      "paymentIntentId": "pi_xxx",
      "status": "Pending",
      "fundedPeriodStart": "2026-01-20",
      "fundedPeriodEnd": "2026-01-26",
      "disputeActive": false, // true if booking has active Option A dispute
      "userMessage": "Payment successful. Your booking will resume once processing completes." // Message varies based on dispute status
    }
  }
  ```
- **Success Response (200) - Payment During Active Dispute:**
  ```json
  {
    "data": {
      "bookingId": "uuid",
      "paymentIntentId": "pi_xxx",
      "status": "Pending",
      "fundedPeriodStart": "2026-01-20",
      "fundedPeriodEnd": "2026-01-26",
      "disputeActive": true,
      "userMessage": "Payment successful. Your booking remains paused due to an active dispute. Please resolve the dispute to resume normal operations."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid booking status or payment method (booking must be in `Active` or `Payment_Paused_Dispute` status for payment retry)
  - `403 Forbidden`: Insufficient permissions (not borrower company admin)
  - `404 Not Found`: Booking not found
  - `409 Conflict`: Payment already in progress or booking not eligible for retry (e.g., booking status is `Suspended_Insurance`)
  - `422 Unprocessable Entity`: Subscription expired or booking not in valid state for payment retry
  - `502 Bad Gateway`: Stripe API unavailable
- **Edge Cases:**
  - **Payment Retry During Active Option A Dispute:** If booking has active Option A dispute (status = `Payment_Paused_Dispute`), payment retry is available. If payment succeeds, booking status remains `Payment_Paused_Dispute` (not `Active`) until all disputes are resolved. If payment fails, booking status remains `Payment_Paused_Dispute`, no status change occurs.
  - **Payment Success During Dispute:** Payment success during active dispute does not resolve the dispute or change booking status. The booking remains in `Payment_Paused_Dispute` until all disputes are resolved through the dispute resolution workflow.

**POST /api/bookings/{bookingId}/tax-exemption** *(Post-MVP)*
- **Status:** Deferred to post-MVP. Tax exemption functionality not required for MVP since Minnesota does not charge sales tax for temporary labor services.
- **Authentication:** Bearer token required
- **Authorization:** Company Admin (borrower company) required
- **Rate Limit:** 10 requests/minute
- **Description:** Declare tax exemption for booking checkout (Post-MVP only)
- **Request Body:**
  ```json
  {
    "exemptionType": "Resale_Certificate", // or "Exemption_Certificate"
    "exemptionNumber": "EX-12345", // Optional: Exemption certificate number
    "documentUrl": "https://storage.example.com/cert.pdf" // Optional: Uploaded certificate document
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "bookingId": "uuid",
      "exemptionType": "Resale_Certificate",
      "exemptionNumber": "EX-12345",
      "applied": true,
      "taxCalculation": {
        "subtotal": 100000, // cents
        "taxAmount": 0, // cents (exempt)
        "total": 100000 // cents
      }
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid exemption type or booking already processed
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Booking not found
  - `422 Unprocessable Entity`: Exemption validation failed

**POST /api/bookings/{bookingId}/refund/calculate**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin (borrower or lender company) required
- **Rate Limit:** 10 requests/minute
- **Description:** Calculate pro-rated refund amount for booking cancellation
- **Request Body:**
  ```json
  {
    "cancellationDate": "2026-01-18T10:00:00Z",
        "refundDestination": "CreditCard" // All refunds go directly to customer's payment method via Stripe API
  }
  ```
- **Success Response (200):**
  ```json
  {
    "data": {
      "bookingId": "uuid",
      "cancellationDate": "2026-01-18T10:00:00Z",
      "refundCalculation": {
        "totalRefundAmount": 50000, // cents
        "serviceFeeRetained": 15000, // cents (30% of original)
        // Note: Stripe processing fees are internal operational expenses, not shown to users
        "netRefundAmount": 50000, // cents (refunded to payment method via Stripe API)
        "refundBreakdown": {
          "pastShifts": 0, // No refund for past/verified shifts
          "currentDay": 10000, // Current day payout
          "futureDays": 40000, // Future days refund (50% for short-term, 100% for long-term notice period)
          "penaltyAmount": 0 // Cancellation penalty if applicable
        },
        "proRatedWeeklyPayments": [
          {
            "weekStart": "2026-01-20",
            "weekEnd": "2026-01-26",
            "daysRefunded": 3,
            "refundAmount": 15000
          }
        ]
      },
      "refundDestination": "CreditCard" // All refunds go directly to payment method via Stripe API
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid cancellation date or booking not cancellable
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Booking not found
  - `409 Conflict`: Booking has active disputes
  - `422 Unprocessable Entity`: Refund calculation failed (e.g., invalid booking status)

**GET /api/bookings/{bookingId}/overtime/status**
- **Authentication:** Bearer token required
- **Authorization:** Company Admin, Manager, Supervisor, or Worker (any role can view overtime calculations)
- **Rate Limit:** 100 requests/minute
- **Description:** Get current overtime status for booking and worker. OT terms are pre-authorized at checkout and stored in `bookings.ot_terms_snapshot`. No unlock workflow - workers can always clock in.
- **Query Parameters:**
  - `workerId` (string, optional): Filter by specific worker
  - `weekStart` (date, optional): Filter by specific week (default: current week)
- **Response (200):**
  ```json
  {
    "data": {
      "bookingId": "uuid",
      "weekStart": "2026-01-20",
      "workers": [
        {
          "workerId": "uuid",
          "currentHours": 38.5,
          "projectedOvertimeHours": 0,
          "projectedOvertimeCost": 0,
          "otTermsSnapshot": {
            "daily_rule": false,
            "weekly_rule": true,
            "weekend_rule": false,
            "ot_rate": 52.50
          }
        }
      ],
      "totalHours": 38.5
    }
  }
  ```

### Marketplace Domain

**GET /api/marketplace/workers/search**
- **Authentication:** Bearer token required (optional for public search)
- **Authorization:** Any authenticated user or public
- **Rate Limit:** 30 requests/minute
- **Implementation:** PostgreSQL native search - queries database directly using read-optimized SQL with real-time availability checks. No separate search index or sync required.
- **Query Parameters:**
  - `page` (integer, default: 1, min: 1): Page number for pagination
  - `pageSize` (integer, default: 20, min: 1, max: 100): Number of results per page
  - `query` (string, optional, max length: 200): Full-text search query (fuzzy matching on trade and skills using `pg_trgm`). Special characters are escaped to prevent SQL injection. Extremely long queries (>200 characters) are truncated.
  - `trade` (string, optional, max length: 100): Filter by trade name. Special characters are escaped.
  - `zipCode` (string, required, format: 5-digit US zip code or 5+4 format): Search center zip code. Must be a valid US zip code format. Invalid zip codes return `400 Bad Request` with error code `INVALID_SEARCH_PARAMETERS`.
  - `radius` (integer, default: 50, min: 1, max: 500): Search radius in miles (uses `earthdistance` or `postgis` extension). Values outside range return `400 Bad Request` with error code `INVALID_SEARCH_PARAMETERS`.
  - `skills` (array, optional, max array length: 50): Filter by skills (hierarchical/nested). Each skill string is validated and escaped. Invalid array format returns `400 Bad Request`.
  - `availabilityStart` (date, optional, format: ISO 8601 YYYY-MM-DD): Required availability start date. Must be a valid date in the future. Past dates return `400 Bad Request` with error code `INVALID_SEARCH_PARAMETERS`.
  - `availabilityEnd` (date, optional, format: ISO 8601 YYYY-MM-DD): Required availability end date. Must be a valid date >= `availabilityStart`. Invalid date ranges return `400 Bad Request` with error code `INVALID_DATE_RANGE`.
  - `minRating` (number, optional, min: 0, max: 5): Minimum average rating. Values outside range return `400 Bad Request`.
  - `minExperienceYears` (number, optional, min: 0, max: 100): Minimum years of experience. Values outside range return `400 Bad Request`.
  - `certifications` (array, optional, max array length: 20): Filter by certifications. Each certification string is validated and escaped.
  - `rateMin` (number, optional, min: 0): Minimum hourly rate in cents. Negative values return `400 Bad Request`.
  - `rateMax` (number, optional, min: 0): Maximum hourly rate in cents. Must be >= `rateMin` if both provided. Invalid rate ranges return `400 Bad Request` with error code `INVALID_SEARCH_PARAMETERS`.
  - `minOnTimeReliability` (number, optional, min: 0, max: 100): Minimum on-time reliability percentage. Values outside range return `400 Bad Request`.
- **Parameter Validation:**
  - All parameters are validated server-side before query execution
  - Invalid parameters return `400 Bad Request` with error code `INVALID_SEARCH_PARAMETERS` and user-friendly error message
  - SQL injection attempts are prevented via parameterized queries - malicious input is escaped, not executed
  - Special characters in string parameters are properly escaped to prevent query manipulation
  - Array parameters are validated for proper format and maximum length
  - Date parameters are validated for format and logical consistency (end date >= start date)
  - Numeric parameters are validated for type, range, and logical consistency (rateMax >= rateMin)
- **Response (200):**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "trade": "Electrician",
        "skills": ["Framing", "Drywall"],
        "yearsOfExperience": 5,
        "hourlyRate": 3500, // cents (lending rate)
        "allInclusivePrice": 4550, // cents (lending rate + service fee)
        "distance": 12.5, // miles
        "avgRating": 4.5,
        "ratingCount": 10,
        "onTimeReliabilityPercent": 95,
        "badges": ["Gold Tier Lender", "Verified"],
        "availability": {
          "startDate": "2026-01-20",
          "endDate": "2026-01-27"
        }
      }
    ],
    "meta": {
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalCount": 150,
        "totalPages": 8
      }
    }
  }
  ```
- **Success Response (200) - Degraded Search:**
  ```json
  {
    "data": [ ... ],
    "meta": {
      "pagination": { ... },
      "degraded": {
        "status": "partial",
        "unavailableFeatures": ["geo_search"],
        "message": "Location-based search is temporarily unavailable. Text search results only."
      }
    }
  }
  ```
  - **Degraded Search Behavior:** If partial extension failure occurs (e.g., `pg_trgm` available but `earthdistance`/`postgis` unavailable), search returns `200 OK` with degraded results (text-only search, no geo filtering). Response includes `degraded` metadata indicating which features are unavailable.
  - **Complete Failure:** If all extensions unavailable, returns `503 Service Unavailable` (not 200 with degraded status).
- **Degraded Search Mode Responses:**
  - **Text-Only Mode (geo extension unavailable):** Response includes `degraded_mode: "text_only"` field. Results include all fields except `distance` (null or omitted). Error code `SEARCH_GEO_UNAVAILABLE` is NOT returned - search succeeds with degraded functionality.
  - **Full Mode (all extensions available):** Response includes `degraded_mode: "full"` or omits the field. Results include all fields including `distance`.
- **Error Responses:**
  - `503 Service Unavailable`: Search service unavailable. Error codes:
    - `SEARCH_SERVICE_UNAVAILABLE`: Database unavailable or PostgreSQL extensions missing
    - `SEARCH_EXTENSION_MISSING`: Required PostgreSQL extensions (pg_trgm, earthdistance/postgis) not installed
    - `SEARCH_EXTENSION_RUNTIME_UNAVAILABLE`: Extension became unavailable during runtime (database configuration issue)
    - `SEARCH_CONNECTION_POOL_EXHAUSTED`: Database connection pool exhausted - all connections in use
    - `SEARCH_REPLICA_LAG_EXCEEDED`: Read replica lag exceeds acceptable threshold (>500ms) - queries routed to primary
  - `200 OK` with degraded results: Partial extension failure (e.g., `pg_trgm` available but `earthdistance`/`postgis` unavailable). Error codes:
    - `SEARCH_EXTENSION_PARTIAL`: Partial extension failure - text search works, geo search disabled
    - `SEARCH_GEO_UNAVAILABLE`: Geo extension unavailable - text search may still work
  - `400 Bad Request`: Invalid search parameters. Error codes:
    - `INVALID_SEARCH_PARAMETERS`: Invalid search parameters provided
    - `NO_SEARCH_RESULTS`: No workers found matching criteria (not an error, but may be returned as informational)
  - `408 Request Timeout` or `500 Internal Server Error`: Search timeout. Error codes:
    - `SEARCH_TIMEOUT`: Search query exceeded timeout threshold (5 seconds) - user should retry with more specific filters
  - `429 Too Many Requests`: Rate limit exceeded (see Rate Limiting section below for search-specific rate limiting details)
  
  **Note:** For complete error message details and user-facing messages, see [Error Message Catalog](./error-message-catalog.md#search--availability-errors).

---

## OpenAPI Specification

### OpenAPI Structure

The SmartBench API follows OpenAPI 3.0 specification. The complete OpenAPI specification should be maintained in a separate file (`openapi.yaml` or `openapi.json`) and validated in CI/CD.

### OpenAPI Components

**Security Schemes:**
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**Common Schemas:**
- `ErrorResponse`: Standard error response structure
- `PaginationMeta`: Pagination metadata structure
- `User`: User entity schema
- `Company`: Company entity schema
- `Booking`: Booking entity schema
- `TimeLog`: Time log entity schema

### OpenAPI Validation

- **CI/CD Integration:** OpenAPI specification validated on every commit
- **Code Generation:** Client SDKs generated from OpenAPI spec
- **Documentation:** Interactive API documentation generated from OpenAPI spec (Swagger UI)

---

## Related Documentation

This section provides links to **related documentation** for API contracts and specifications.

- [Architecture](../architecture.md) - High-level technical architecture
- [Database Schema](./schema.md) - Database schema definitions
- [Data Dictionary](./data-dictionary.md) - Business entity definitions
- [Authentication System Blueprint](./blueprints/identity/authentication-system.md) - Authentication implementation details

---

**Note:** This API contract document should be kept in sync with the actual API implementation. All breaking changes must be versioned and documented with migration guides.
