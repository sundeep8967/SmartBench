# Feature Blueprint: Notification Delivery System

**Domain:** Notifications  
**Related Epics:** All epics (notifications are cross-cutting)  
**Related Documentation:** [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md), [Notifications Domain Data Dictionary](../../data-dictionary-notifications.md)

---

## Requirement Reference

For detailed business rules and context, see:
- [Notifications Domain Data Dictionary](../../data-dictionary-notifications.md) - Notification module architecture and business rules
- [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md) - Notification types, channels, and role-based routing
- [Notifications Domain Schema](../../schema-notifications.md) - Database schema for notification tables

---

## Technical Strategy (The "How")

### Notification Delivery Platform

**Decision:** Use BullMQ (Redis) for queue-based notification processing with quiet hours enforcement and channel abstraction.

**Rationale:**
- Prevents database connection pooling issues when processing thousands of notifications simultaneously
- Allows long-running processes without serverless timeout constraints
- Enables rate limiting and controlled concurrency to prevent API rate limits (e.g., Twilio, SendGrid)
- Rolling window strategy prevents "thundering herd" when sending mass notifications
- Decouples notification queuing from delivery execution

**Implementation:** See [Tech Stack](../../tech-stack.md) for BullMQ configuration.

### Service Provider Details

**SMS Provider: Twilio**
- **Purpose:** SMS delivery and phone number verification
- **API Endpoint:** Twilio Messaging API
- **Authentication:** Account SID and Auth Token
- **Rate Limits:** Varies by account tier (typically 1 message per second per phone number, higher limits for verified accounts)
- **Regional Support:** Global coverage, supports US and international numbers
- **Configuration:** See [Tech Stack](../../tech-stack.md) for Twilio configuration details

**Email Provider: SendGrid**
- **Purpose:** Transactional email delivery
- **API Endpoint:** SendGrid Mail Send API v3
- **Authentication:** API Key with Mail Send permissions
- **Rate Limits:** Varies by account tier (typically 100 emails/second for free tier, higher for paid)
- **Regional Support:** Global email delivery
- **Configuration:** See [Tech Stack](../../tech-stack.md) for SendGrid configuration details

**Provider Selection Rationale:**
- **Twilio:** Industry-leading SMS delivery reliability, comprehensive API, strong developer experience
- **SendGrid:** High deliverability rates, robust analytics, scalable infrastructure
- Both providers offer webhook callbacks for delivery status updates

**Provider Abstraction:**
- All provider-specific logic is encapsulated in the Notifications module
- Other modules never directly import Twilio or SendGrid SDKs
- Provider abstraction allows for future migration or multi-provider support if needed

---

## Notification Queue Processing

**Purpose:** Process queued notifications (SMS, Email, Push) with retry logic, quiet hours enforcement, and channel abstraction.

**Schedule:**
- **Trigger:** Inngest Event-driven (triggered when notification queued)
- **Retry Logic:** Exponential backoff (3 attempts: 2s, 10s, 60s)

**Workflow Steps:**

1. Receive notification event (SMS, Email, or Push)
2. **Quiet Hours Check:** Query `notification_preferences` for recipient
   - If notification is critical (as defined in [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md)), bypass quiet hours
   - If notification is action-required, bypass quiet hours
   - If notification is non-critical and within quiet hours, queue for delivery after quiet hours end
   - If outside quiet hours (or critical/action-required), proceed to delivery
3. **Channel Selection:** Based on notification type and user preferences
   - Check `notification_preferences` for enabled channels
   - Critical notifications send to both SMS and Email simultaneously (not sequential fallback)
4. **Delivery Attempt:**
   - Attempt delivery via primary channel (Twilio for SMS, SendGrid for Email, Push service for Push)
   - On failure: Retry with exponential backoff
   - On final failure: Fallback to alternative channel or dead letter queue
5. **Logging:** Log delivery status in `notification_logs` table
   - Store provider ID (Twilio Message SID, SendGrid Message ID)
   - Store content for audit/compliance
   - Store error details if delivery failed
6. **Inbox Entry:** Create entry in `notification_inbox` for in-app notification center

**Failure Handling:**

**SMS Delivery Failures:**
1. **Retry Strategy:** Exponential backoff with 3 attempts (2s, 10s, 60s delays)
2. **Fallback:** If all SMS retries fail, automatically send via Email channel **if user has an email address** (phone-first: email is optional for Workers)
3. **Error Classification:**
   - **Retryable Errors:** Network timeouts, 429 (rate limit), 500/502/503/504 (server errors), connection errors
   - **Non-Retryable Errors:** Invalid phone number (400), unauthorized (401), unverified sender (403)
4. **Dead Letter Queue:** Non-retryable failures logged to dead letter queue for manual review. If user has no email and SMS fails, notification is logged to dead letter queue for manual processing.
5. **Notification:** User receives email notification if SMS fails completely **and user has an email address**. For phone-only users (no email), failed SMS notifications are logged to dead letter queue for manual review.

**Email Delivery Failures:**
1. **Retry Strategy:** Exponential backoff with 3 attempts (2s, 10s, 60s delays)
2. **No Fallback:** Email is the fallback channel, so no further fallback exists
3. **Error Classification:**
   - **Retryable Errors:** Network timeouts, 429 (rate limit), 500/502/503/504 (server errors), connection errors
   - **Non-Retryable Errors:** Invalid email address (400), unauthorized (401), blocked sender (403), spam/bounce (rejected by recipient server)
4. **Dead Letter Queue:** All final failures logged to dead letter queue for manual review and potential re-send
5. **Bounce Handling:** Hard bounces (invalid email) marked in user profile, future emails to that address blocked

**Push Notification Failures:**
1. **Retry Strategy:** Exponential backoff with 2 attempts (5s, 30s delays)
2. **Non-Blocking:** Push failures do not block SMS or Email delivery
3. **Error Classification:**
   - **Retryable Errors:** Service unavailable, network timeouts
   - **Non-Retryable Errors:** Invalid device token, uninstalled app, user disabled push notifications
4. **Token Cleanup:** Invalid device tokens removed from user's device registry

**Critical Notifications:**
- Both SMS and Email sent simultaneously (not sequential fallback)
- If SMS fails, Email still delivers (and vice versa)
- Maximum reliability for critical alerts (as defined in [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md))
- No quiet hours enforcement for critical notifications

**Quiet Hours Enforcement:**
- The Notifications module is the **sole authority** on quiet hours logic
- Quiet hours are calculated based on user's timezone (from `user_preferences.timezone`)
- Non-critical notifications queued during quiet hours are delivered after quiet hours end
- Critical notifications (as defined in [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md)) bypass quiet hours

**Channel Abstraction:**
- Other modules (Messaging, Booking, etc.) emit events with notification requests
- Notifications module handles all provider-specific logic (Twilio, SendGrid, Push)
- Modules never import Twilio/SendGrid wrappers directly
- Communication happens via internal service events

**Cross-Module Communication Example:**
- Messaging module emits `chat.message.created` event
- Notifications module listens for this event
- Notifications module checks if recipient is offline
- Notifications module checks quiet hours (if non-critical)
- Notifications module sends SMS/Push notification if appropriate

**Related Documentation:** See [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md) for notification types and channels.

---

## Notification Delivery Patterns

### Mass Notifications

**Use Case:** Sending notifications to hundreds of users simultaneously (e.g., "Wednesday Rule" alerts)

**Pattern:**
- Enqueue individual notification jobs into BullMQ queue
- Process queue at controlled rate (e.g., 200 notifications per batch)
- Use rolling window strategy to prevent thundering herd
- Rate limit to prevent API provider limits

### Critical Notifications

**Use Case:** Critical notifications as defined in [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md)

**Pattern:**
- Bypass quiet hours (always deliver immediately)
- Send to both SMS and Email channels simultaneously (not sequential)
- No fallback delay - both channels triggered at same time
- Ensures maximum delivery reliability for critical alerts

### Context-Aware Notifications

**Use Case:** Notifications linked to business entities (Bookings, Disputes)

**Pattern:**
- Include deep links in notification content
- Deep links navigate to relevant content (booking details, dispute resolution)
- Deep links remain active for 24 hours after notification creation
- Inbox entries include deep link for in-app navigation

---

## Performance Optimization

### Database Indexes

**Critical Indexes for Notification Processing:**
- `notification_preferences(user_id)` - Fast quiet hours lookup
- `notification_logs(user_id, created_at)` - User notification history
- `notification_logs(status)` - Failed notification queries
- `notification_inbox(user_id, is_read)` - Unread notification queries

### Batch Processing

**Batch Size Limits:**
- Notification queue: Process 200 notifications per batch
- Mass notifications: Enqueue individually, process in batches

**Timeout Handling:**
- Jobs timeout after 5 minutes
- Partial results logged for continuation
- Failed batches retried with smaller batch size

---

## Monitoring and Alerting

### Health Checks

**Monitoring Metrics:**
- Notification delivery success/failure rates
- Quiet hours queue size
- Provider API response times
- Dead letter queue size

### Alerting

**Critical Alerts:**
- Notification delivery failures (> 10% failure rate)
- Dead letter queue growth (> 100 items)
- Provider API failures (Twilio, SendGrid)

**Warning Alerts:**
- High retry rates (> 20% of notifications)
- Quiet hours queue growth
- Provider API rate limit warnings

---

## Service Provider SLAs and Delivery Guarantees

### Twilio SMS SLAs

**Delivery Guarantees:**
- **Delivery Time:** 95% of SMS messages delivered within 30 seconds
- **Delivery Rate:** 99.9% delivery success rate for valid phone numbers
- **Uptime SLA:** 99.95% API uptime
- **Regional Delivery:** US numbers typically deliver within 5-10 seconds

**Limitations:**
- Delivery not guaranteed for invalid/unreachable phone numbers
- Carrier filtering may delay or block messages (not Twilio's control)
- International delivery times vary by country and carrier

**Monitoring:**
- Track delivery status via Twilio webhooks (`message.sent`, `message.delivered`, `message.failed`)
- Store delivery status in `notification_logs` table with provider message SID
- Alert on delivery failure rate > 5% over 1-hour window

### SendGrid Email SLAs

**Delivery Guarantees:**
- **Delivery Time:** 95% of emails delivered to recipient server within 5 minutes
- **Delivery Rate:** 99% delivery success rate for valid email addresses (excluding bounces/spam)
- **Uptime SLA:** 99.9% API uptime
- **Inbox Delivery:** Delivery to inbox (not spam folder) depends on sender reputation and content

**Limitations:**
- Final delivery to user's inbox depends on recipient mail server (not SendGrid's control)
- Spam filtering may delay or block messages
- Bounce rates vary by list quality and sender reputation

**Monitoring:**
- Track delivery status via SendGrid webhooks (`delivered`, `bounce`, `dropped`, `deferred`)
- Store delivery status in `notification_logs` table with SendGrid message ID
- Alert on bounce rate > 10% or delivery failure rate > 5% over 1-hour window

### Platform Delivery Targets

**Our Internal SLAs (Based on Provider SLAs):**
- **SMS Delivery:** 95% delivered within 60 seconds (includes queue time + provider delivery)
- **Email Delivery:** 95% delivered within 10 minutes (includes queue time + provider delivery)
- **Critical Notifications:** 99% delivered within 2 minutes (bypasses quiet hours, uses both channels)
- **Overall System Uptime:** 99.9% (depends on both our infrastructure and provider uptime)

**Service Level Objectives (SLOs):**
- Notification queue processing latency: P95 < 5 seconds
- Provider API response time: P95 < 2 seconds
- Dead letter queue processing: Manual review within 24 hours

## Error Handling

All notification delivery implements comprehensive error handling:

- **Retry Logic:** Exponential backoff with jitter (see Failure Handling section above for detailed retry strategies)
- **Circuit Breakers:** Prevent cascade failures when providers are down
  - Circuit opens after 50% failure rate over 1-minute window
  - Half-open state after 30 seconds, closes after 3 successful requests
- **Dead Letter Queue:** Manual review for failed notifications
  - Failed notifications after all retries logged to dead letter queue
  - Admin dashboard shows failed notifications with error details
  - Manual re-send capability for critical notifications
- **Logging:** Structured logs with correlation IDs
  - All delivery attempts logged with provider response codes
  - Error details stored in `notification_logs.error_details` JSONB field
  - Correlation IDs link related retry attempts
- **Monitoring:** Track success rates and alert on failures
  - Real-time dashboards for delivery success/failure rates
  - Alerts on provider API failures or high error rates
  - Weekly reports on delivery performance

**Related Documentation:** See [Error Handling Blueprint](../system/error-handling.md) for complete error handling patterns.

---

## Notification Types

The system supports various notification types with specific delivery rules:

- **Critical Notifications:** Bypass quiet hours, sent to both SMS and Email simultaneously
- **Action-Required Notifications:** Bypass quiet hours, require user action
- **Standard Notifications:** Respect quiet hours, use user's channel preferences

**Example Notification Types:**
- See [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md) for complete list of notification types

## Related Documentation

- [Notifications Domain Data Dictionary](../../data-dictionary-notifications.md) - Notification module architecture and business rules
- [Notifications Domain Schema](../../schema-notifications.md) - Database schema for notification tables
- [Notifications & RBAC Matrix](../../../prd/notifications-rbac-matrix.md) - Notification types, channels, and role-based routing
- [Repository Structure](../../repository-structure-development-standards.md) - Module structure and cross-module communication patterns
- [Error Handling Blueprint](../system/error-handling.md) - Error handling patterns
- [Tech Stack](../../tech-stack.md) - BullMQ configuration
