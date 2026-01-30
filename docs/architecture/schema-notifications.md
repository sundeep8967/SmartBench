# Database Schema - Notifications Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Notifications domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Notifications Domain](./data-dictionary-notifications.md).**

---

## Notifications Domain

### notification_preferences

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '07:00:00'
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Technical Constraints:**
- `user_id` must be UNIQUE (one preferences record per user)
- `quiet_hours_start` and `quiet_hours_end` are TIME values (24-hour format)
- Quiet hours are optional (nullable fields)
- Default notification channels are all enabled (SMS, Email, Push)

**Business Rules:**
- See [Notifications & RBAC Matrix](../prd/notifications-rbac-matrix.md) for authoritative rules regarding channel selection, quiet hours enforcement, and critical alert definitions.
- **Timezone for Quiet Hours:** Timezone for quiet hours calculation is stored in `user_preferences.timezone` (Identity domain). For detailed timezone calculation logic, fallback behavior, and implementation details, see [Notification Preferences - Quiet Hours Timezone Calculation](./data-dictionary-notifications.md#notification-preferences) in the Data Dictionary.

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

### notification_logs

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- ENUM: 'sms', 'email', 'push', 'sms_fallback_email'
  recipient VARCHAR(255) NOT NULL, -- Email address or phone number
  provider_id VARCHAR(255), -- e.g., Twilio Message SID, SendGrid Message ID
  status VARCHAR(50) NOT NULL, -- ENUM: 'queued', 'delivered', 'failed', 'email_sent'
  content TEXT, -- Notification content for audit purposes
  error TEXT, -- Error details if delivery failed
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Technical Constraints:**
- `type` ENUM: 'sms', 'email', 'push', 'sms_fallback_email'
- `status` ENUM: 'queued', 'delivered', 'failed', 'email_sent'
- `provider_id` is nullable (populated after provider API call)
- `content` stores notification text for audit/compliance
- `user_id` is nullable (SET NULL on delete) to preserve audit trail even if user is deleted

**Business Rules:**
- All notification attempts are logged, regardless of success or failure
- Provider IDs are stored for tracking and debugging with external services
- Content is stored for compliance and debugging purposes
- Logs are append-only (immutable audit trail)
- Failed notifications include error details for troubleshooting

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX idx_notification_logs_provider_id ON notification_logs(provider_id) WHERE provider_id IS NOT NULL;

### notification_inbox

```sql
CREATE TABLE notification_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT, -- URL or route for navigation to relevant content
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);
```

**Technical Constraints:**
- `is_read` defaults to FALSE
- `read_at` is nullable (populated when user marks notification as read)
- `deep_link` is nullable (not all notifications require navigation)

**Business Rules:**
- One inbox entry per notification shown in UI
- Notifications persist until user marks them as read or deletes them
- Deep links enable navigation to relevant content (e.g., booking details, dispute resolution)
- Read status tracks user engagement
- Inbox entries are created when notifications are delivered (not when queued)

CREATE INDEX idx_notification_inbox_user_id ON notification_inbox(user_id);
CREATE INDEX idx_notification_inbox_is_read ON notification_inbox(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notification_inbox_created_at ON notification_inbox(user_id, created_at DESC);

---

**Back to:** [Database Schema](./schema.md)
