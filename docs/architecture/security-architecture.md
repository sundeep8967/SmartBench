# H. Security Architecture

**Context:** Financial transactions, PII handling, and multi-tenant architecture require comprehensive security measures at every layer of the application.

**Decision:** Implement defense-in-depth security strategy with authentication, authorization, encryption, rate limiting, and audit logging.

## 1. Authentication & Authorization

**Authentication Implementation:**
- **JWT-Based Authentication:** Stateless JWT tokens with 24-hour expiration, refresh tokens with 7-day expiration
- **Phone-First Authentication:** Mobile number is the primary identifier for workers. The system enforces that users must have either an email OR a mobile_number (enforced by database CHECK constraint). For Workers: mobile_number is required (primary identifier), email is optional. For non-Workers: Either email or mobile_number is required. Login accepts either email or mobile number as identifier.
- **Password Security:** Bcrypt hashing with salt rounds (minimum 12 rounds), password complexity requirements
- **Magic Link Authentication:** SMS-based passwordless authentication for supervisor verification workflows and worker onboarding
- **OAuth2 Integration:** Stripe Connect OAuth2 for lender account linking
- **Mobile Number Security Considerations:**
  - Mobile numbers are unique identifiers and must be validated for format and uniqueness
  - SMS delivery requires secure handling of phone numbers (encrypted in transit, access-controlled)
  - Phone number as primary identifier has privacy implications - ensure compliance with data protection regulations
  - Mobile number validation prevents duplicate accounts and ensures data integrity

**Implementation Details:** See [Authentication System Blueprint](./blueprints/identity/authentication-system.md) for complete JWT implementation, password hashing, and session management.

**Role-Based Access Control (RBAC):**

**Business Rules Reference:** For complete role definitions, capabilities, relationships, and permission matrices, see:
- [User Roles and Actors](../prd/user-roles-and-actors.md) - Role definitions, capabilities, and business context
- [RBAC Acceptance Criteria](../prd/rbac-acceptance-criteria.md) - Feature-level permission matrices across all epics

**Technical Implementation:**
- **Role Hierarchy:** System Admin > Company Admin > Manager > Supervisor > Worker (matches PRD role hierarchy)
- **Permission Model:** Role-based permissions stored in `company_members.roles` JSONB field
- **API Authorization:** Middleware validates JWT token and checks role permissions before processing requests
- **Resource-Level Authorization:** Users can only access resources for companies they belong to

**Implementation Details:** See [Unified User Model Blueprint](./blueprints/identity/unified-user-model.md) for RBAC middleware implementation, role checking patterns, and database schema.

## 2. Data Encryption

**Encryption at Rest:**
- **Database Encryption:** PostgreSQL encryption at rest enabled (TDE or filesystem-level encryption)
- **Sensitive Field Encryption:** PII fields encrypted with application-level encryption before storage:
  - SSN (if collected): AES-256 encryption
  - Bank account numbers: AES-256 encryption
  - Stripe account IDs: Encrypted storage
- **File Storage Encryption:** S3 bucket encryption enabled (SSE-S3 or SSE-KMS)

**Encryption in Transit:**
- **TLS/SSL:** All API endpoints require HTTPS (TLS 1.2 minimum)
- **Database Connections:** SSL/TLS required for all database connections
- **External API Calls:** All external service calls use HTTPS
- **WebSocket Connections:** WSS (WebSocket Secure) for real-time features

**Key Management:**
- **Encryption Keys:** Stored in secure key management service (AWS KMS, Azure Key Vault, or similar)
- **Key Rotation:** Encryption keys rotated annually or on security incident
- **Access Control:** Encryption keys accessible only to application service account

## 3. API Rate Limiting

**Decision:** Implement rate limiting to prevent abuse and ensure fair resource usage.

**Rate Limiting Strategy:**
- **Authentication Endpoints:** 5 requests per minute per IP address
- **API Endpoints:** 100 requests per minute per authenticated user
- **Financial Operations:** 10 requests per minute per user (stricter limits for payment operations)
- **Search Endpoints:** 30 requests per minute per user
- **Webhook Endpoints:** 1000 requests per minute per webhook source (Stripe, etc.)

**Rate Limiting Implementation:**
- **Redis-Based:** Rate limiting counters stored in Redis with sliding window algorithm
- **Response Headers:** Include rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- **Error Response:** Return `429 Too Many Requests` with retry-after header
- **Whitelisting:** System Admin and internal services exempt from rate limits

**Rate Limiting Bypass Prevention:**

**Bypass Scenarios:**
- Multiple user accounts from same IP
- Token rotation to reset rate limits
- Distributed requests across multiple devices

**Prevention Measures:**

1. **IP-Level Rate Limiting:**
   - Add secondary rate limit at IP level (e.g., 100 requests/minute per IP) to prevent abuse from multiple accounts
   - IP-level limits apply in addition to per-user limits
   - Separate counters for IP-level and user-level rate limiting

2. **Token Rotation Detection:**
   - Monitor for rapid token rotation patterns (may indicate abuse)
   - Track token creation frequency per user
   - Alert when token rotation exceeds normal patterns (e.g., > 10 tokens created per hour)

3. **Distributed Request Detection:**
   - Monitor for coordinated requests from multiple devices/IPs (may indicate scraping)
   - Track request patterns: same search queries from multiple IPs, similar timing patterns
   - Alert on suspicious distributed request patterns

4. **Rate Limit Header Security:**
   - Ensure rate limit headers are accurate and cannot be manipulated
   - Headers calculated server-side, never trust client-provided rate limit values
   - Headers reflect actual rate limit state, not client requests

**Monitoring and Alerting:**
- Monitor rate limit bypass attempts (multiple accounts from same IP, rapid token rotation)
- Alert on suspicious patterns indicating potential abuse
- Track rate limit abuse events for security analysis

## 4. PII Handling & GDPR Compliance

**PII Data Classification:**
- **Highly Sensitive:** SSN, bank account numbers, government IDs (encrypted at rest and in transit)
- **Sensitive:** Email addresses, phone numbers, addresses (encrypted in transit, access-controlled)
- **Standard:** Names, company information (access-controlled, no special encryption)

**GDPR Compliance:**
- **Right to Access:** Users can request export of all personal data
- **Right to Deletion:** Users can request account deletion (with business record retention requirements)
- **Data Minimization:** Collect only necessary PII for business operations
- **Consent Management:** Explicit consent for data processing, clear privacy policy
- **Data Retention:** PII retained only as long as necessary for business operations or legal requirements

**PII Handling Procedures:**
- **Access Logging:** All PII access logged in audit log with user ID and timestamp
- **Data Anonymization:** PII anonymized in logs and non-production environments
- **Secure Deletion:** PII securely deleted using cryptographic erasure when no longer needed

## 5. Audit Logging

**Decision:** Comprehensive audit logging beyond `audit_log` table for security and compliance.

**Audit Log Requirements:**
- **Authentication Events:** Login attempts, logout, password changes, token refresh
- **Authorization Events:** Permission denials, role changes, access to sensitive resources
- **Financial Events:** All payment transactions, payment processing, refund operations
- **Data Access Events:** Access to PII, sensitive company data, financial records
- **Administrative Actions:** User bans, company suspensions, system configuration changes
- **Search Query Events:** Search queries with PII redaction (see Search Query Audit Logging below)

**Audit Log Implementation:**
- **Structured Logging:** JSON-formatted logs with consistent schema
- **Log Aggregation:** Centralized log aggregation service (e.g., CloudWatch, Datadog, ELK stack)
- **Log Retention:** Financial and security logs retained for 7 years (compliance requirement)
- **Log Integrity:** Cryptographic hashing of log entries to prevent tampering
- **Real-Time Alerting:** Alert on suspicious patterns (multiple failed logins, unusual financial activity)

**Search Query Audit Logging:**

**Policy:** Log search queries with PII redaction for security monitoring, performance analysis, and abuse detection.

**Logged Data:**
- **Search Filters:** Trade, skills, location (zip code), availability date ranges, rating filters, rate ranges
- **Result Count:** Number of workers returned in search results
- **Execution Time:** Query execution time in milliseconds
- **Timestamp:** Query execution timestamp

**Redacted Data (NOT Logged):**
- User IDs (authenticated user ID not logged)
- Company IDs (company context not logged)
- Specific worker IDs in results (worker identifiers not logged)
- Personal information (names, emails, phone numbers)

**Purpose:**
- Security monitoring: Detect unusual search patterns, potential abuse
- Performance analysis: Identify slow queries, optimize search performance
- Abuse detection: Identify scraping attempts, automated search abuse

**Retention:**
- 90 days (standard application logs)
- Logs stored in centralized log aggregation service
- Logs searchable for security investigations

**Alternative Approach (Privacy-First):**
- **Option B:** No search query logging (privacy-first approach)
  - Only log search errors and security incidents
  - Trade-off: Less visibility for security monitoring
  - Recommended for privacy-sensitive deployments

**Log Format:**
```json
{
  "event_type": "search_query",
  "timestamp": "2026-01-27T10:30:00Z",
  "filters": {
    "trade": "Electrician",
    "zip_code": "90210",
    "availability_start": "2026-02-01",
    "availability_end": "2026-02-07",
    "min_rating": 4.0
  },
  "result_count": 24,
  "execution_time_ms": 145,
  "ip_address": "[REDACTED]",
  "user_id": "[REDACTED]"
}
```

**Search Query Security Considerations:**

**SQL Injection Prevention:**
- All search parameters must use parameterized queries (never string concatenation)
- Input validation: Validate and sanitize all search parameters before query construction
- Type validation: Ensure numeric parameters are cast to appropriate types
- Length limits: Enforce maximum length for text search parameters (e.g., 200 characters)
- Special character handling: Parameterized queries automatically escape special characters
- See [Worker Search Engine Blueprint](./blueprints/marketplace/worker-search-engine.md#sql-injection-prevention) for detailed implementation

**Implementation Details:** *(Note: Audit Logging Blueprint not yet created - planned for future implementation. Will include detailed audit log schema and implementation patterns.)*
