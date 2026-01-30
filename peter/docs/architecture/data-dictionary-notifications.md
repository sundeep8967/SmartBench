# Data Dictionary - Notifications Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Data Dictionary](./data-dictionary.md)

This document contains business-focused descriptions of Notifications domain entities, their relationships, and business rules. For technical schema definitions, SQL table structures, constraints, and indexes, see [schema-notifications.md](schema-notifications.md).

**ENUM Values:** All ENUM values referenced in this document are defined in [schema-notifications.md](schema-notifications.md), which serves as the single source of truth for all technical ENUM definitions. This document provides business context for these values.

---

## Notifications Domain

### Module Role: "Central Dispatch" / "Town Crier"

The Notifications module serves as the central routing and delivery system for all outbound communications. It abstracts channel-specific logic (SMS, Email, Push) and provides a unified interface for other modules to send notifications without needing to know the delivery mechanism.

**Core Responsibilities:**
1. **Channel Abstraction:** Wraps providers (Twilio, SendGrid, Push). Other modules just say "Notify User X," and this module figures out *how*.
2. **Quiet Hours Enforcement:** Checks `notification_preferences`. If a non-critical notification triggers during quiet hours, it queues it for the morning.
3. **In-App Inbox:** Manages the persistent list of notifications (The "Bell Icon" view) for the PWA.

**Architecture Pattern:**
- **Transactional & Bursty:** Handles mass notifications (e.g., "Wednesday Rule" alerts to hundreds of users)
- **Queue-Based:** Uses BullMQ (Redis) for reliable job processing
- **Provider Abstraction:** Encapsulates Twilio/SendGrid API logic
- **Template Management:** Handles email/SMS string interpolation

### Notification Preferences {#notification-preferences}

User-specific notification settings that control delivery behavior and channel preferences.

**Key Attributes:**
- User reference
- Quiet hours configuration (start/end times)
- Channel preferences (SMS, Email, Push enabled/disabled)
- Timezone (for quiet hours calculation)

**Business Rules:**
- One preferences record per user
- Quiet hours are optional (if not set, notifications are sent immediately)
- **Quiet Hours Timezone Calculation:** Quiet hours are calculated using the user's timezone from `user_preferences.timezone` (Identity domain). This is the **sole authoritative source** for quiet hours timezone calculations.
  - **Timezone Source:** The system retrieves the user's timezone from `user_preferences.timezone` field (stored in IANA timezone database format, e.g., 'America/Chicago'). This timezone is used exclusively for quiet hours calculations.
  - **Calculation Logic:** When checking if a notification should be queued due to quiet hours, the system: (1) Retrieves user's timezone from `user_preferences.timezone`, (2) Converts current UTC time to user's local timezone using timezone-aware libraries (Luxon/DayJS), (3) Compares the converted local time against `quiet_hours_start` and `quiet_hours_end` TIME values, (4) Queues non-critical notifications if current time falls within the quiet hours window (between start and end times).
  - **Fallback Behavior:** If `user_preferences.timezone` is not set (null), quiet hours are not enforced (notifications sent immediately). This differs from display timezone fallback which uses company default or project timezone. **Explicit Rule:** Quiet hours timezone has no fallback - if user timezone is not set, quiet hours are disabled.
  - **Explicit Rule:** Quiet hours timezone is **always** user timezone, never project timezone or company timezone. This ensures users receive notifications according to their personal schedule, regardless of where projects are located. For example, a Borrowing Admin in New York (EST) working on a project in Minnesota (CST) will have quiet hours calculated in EST, not CST.
- See [Notifications & RBAC Matrix](../prd/notifications-rbac-matrix.md) for authoritative rules regarding channel selection, quiet hours enforcement, and critical alert definitions.
- Default channel preferences: All channels enabled (SMS, Email, Push) - this is a user preference setting, not a business rule about which channels are used for specific notification types

**Usage:**
- See [Notifications & RBAC Matrix](../prd/notifications-rbac-matrix.md) for authoritative rules regarding quiet hours enforcement and which notifications bypass quiet hours.
- See [Notification Delivery Blueprint](./blueprints/notifications/notification-delivery.md) for queue processing and delivery logic, including quiet hours check process and retry strategies.
- Timezone used for converting UTC timestamps to user's local time for quiet hours calculation only (not for display purposes)
- Preferences can be updated by user at any time
- The Notifications module is the **sole authority** on quiet hours logic - no other module should implement date/time logic for delivery

**Related Documentation:**
- See [Notifications & RBAC Matrix](../prd/notifications-rbac-matrix.md) for critical notification definitions
- See [User Preferences](./data-dictionary-identity.md#user-preferences) for timezone and general user preferences

### Notification Log

Audit trail for all notification delivery attempts. Tracks provider responses, delivery status, and errors for debugging and compliance.

**Key Attributes:**
- Notification type (SMS, Email, Push)
- Recipient information
- Provider ID (e.g., Twilio Message SID, SendGrid Message ID)
- Delivery status
- Content (for audit purposes)
- Error details (if delivery failed)

**Business Rules:**
- All notification attempts are logged, regardless of success or failure
- Provider IDs are stored for tracking and debugging
- Failed notifications include error details for troubleshooting
- Logs are append-only (immutable audit trail)
- Content is stored for compliance and debugging purposes

**Usage:**
- Debugging delivery failures
- Compliance and audit requirements
- Provider performance monitoring
- Retry logic decision-making

**Related Documentation:**
- See [Notification Delivery Blueprint](./blueprints/notifications/notification-delivery.md) for notification queue processing

### Notification Inbox

Persistent in-app notification list for the PWA "Bell Icon" view. Provides users with a centralized location to view all notifications.

**Key Attributes:**
- User reference
- Notification title and body
- Deep link (for navigation to relevant content)
- Read status
- Timestamp

**Business Rules:**
- One inbox entry per notification shown in UI
- Notifications persist until user marks them as read or deletes them
- Deep links enable navigation to relevant content (e.g., booking details, dispute resolution)
- Read status tracks user engagement
- Inbox entries are created when notifications are delivered (not when queued)

**Usage:**
- PWA "Bell Icon" UI displays unread notifications
- Users can mark notifications as read
- Deep links provide quick navigation to relevant content
- Notification history is preserved for user reference

### Notification Types

See [Notifications & RBAC Matrix](../prd/notifications-rbac-matrix.md) for the authoritative list of notification types, default channels, and quiet hours overrides.

**Cross-Module Communication:**

The Notifications module listens for events from other modules:

- **Messaging Module:** Listens for `chat.message.created` events
  - When User A sends a chat message to User B:
    1. Messaging Module saves message to DB
    2. Messaging Module emits internal event: `chat.message.created`
    3. Notifications Module listens for `chat.message.created`
    4. Notifications checks if User B is offline
    5. Notifications sends SMS/Push: "You have a new message from..."

**Architecture Principles:**

1. **Rule 1: Cross-Module Communication via Events**
   - Other modules (e.g., Messaging) should NEVER import Twilio/SendGrid wrappers directly
   - Communication happens via internal service events
   - Notifications module is the single point of delivery

2. **Rule 2: Shared "Quiet Hours" Logic**
   - The Notifications module is the **Sole Authority** on whether a message gets sent *now* or *later*
   - No other module should implement date/time logic for delivery

3. **Rule 3: Directory Structure**
   - Module structure reflects separation:
     ```
     /src/modules
       /notifications
         /queues       <-- BullMQ processors
         /providers    <-- Twilio/SendGrid logic
         /templates
     ```

---

**Back to:** [Data Dictionary](./data-dictionary.md)
