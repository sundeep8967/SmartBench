# Database Schema - Messaging Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Messaging domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Messaging Domain](./data-dictionary-messaging.md).**

---

## Messaging Domain

### chat_channels

```sql
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type VARCHAR(50) NOT NULL, -- ENUM: 'Booking', 'Dispute'
  context_id UUID NOT NULL, -- Reference to booking_id or dispute_id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(context_type, context_id)
);
```

**Technical Constraints:**
- `context_type` ENUM: 'Booking', 'Dispute'
- `(context_type, context_id)` must be UNIQUE (one channel per context)
- `context_id` references different tables based on `context_type`:
  - If `context_type = 'Booking'`, references `bookings.id`
  - If `context_type = 'Dispute'`, references `disputes.id`
- Foreign key constraints - Enforced at Application Level (Relational Check: polymorphic relationship where `context_id` references different tables based on `context_type`)

**Business Rules:**
- Channels are created automatically when first message is sent in a context
- One channel per context (e.g., one channel per booking)
- Channels persist for the lifetime of the context entity
- Future context types can be added as needed

**Chat Channel Context Determination:**

The system determines chat channel context based on the user's action and the message metadata:

**Booking Context:**
- Channel is created automatically when the first message is sent related to a booking
- Context is determined by `booking_id` from:
  - Message metadata when user clicks "Message Worker" or "Message Supervisor" button on booking details page
  - User action context (e.g., initiating message from booking workflow)
- `context_type = 'Booking'` and `context_id = booking_id`
- Participants are automatically added based on booking participants (worker, supervisor, borrower admin, lender admin)

**Dispute Context:**
- Channel is created automatically when a dispute is filed
- Context is determined by `dispute_id` from the dispute record
- `context_type = 'Dispute'` and `context_id = dispute_id`
- Participants are automatically added based on dispute participants (supervisor, worker, and relevant admins)

**General Company-to-Company Messaging:**
- **MVP Behavior:** For MVP, general company-to-company messaging is limited to booking/dispute contexts only
- **If users are participants in an active booking:** System uses the existing booking channel (no new channel created)
- **If no active booking exists:** System prevents general messaging (users must have an active booking or dispute to message)
- **Future Enhancement:** Post-MVP, the system may support direct company-to-company channels with `context_type = 'General'` and `context_id = NULL` (or a company-to-company relationship ID)

**Channel Creation Logic:**
1. User initiates message from UI (e.g., "Message Worker" button, dispute filing)
2. System determines context from user action or message metadata
3. System checks if channel exists for this context: `SELECT * FROM chat_channels WHERE context_type = ? AND context_id = ?`
4. If channel exists: Use existing channel
5. If channel does not exist: Create new channel with determined context
6. System adds participants to channel based on context type (booking participants, dispute participants, etc.)
7. Message is sent in the channel

**Context Priority:**
- Booking context takes precedence over general messaging
- If multiple contexts exist (e.g., booking with active dispute), users should use the dispute channel for dispute-related communication

CREATE INDEX idx_chat_channels_context ON chat_channels(context_type, context_id);
CREATE INDEX idx_chat_channels_updated_at ON chat_channels(updated_at DESC);

### chat_participants

```sql
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP, -- Timestamp when user last viewed the channel
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);
```

**Technical Constraints:**
- `(channel_id, user_id)` must be UNIQUE (one participation record per user-channel pair)
- `last_read_at` is nullable (null indicates user has never read the channel)
- Foreign key to `chat_channels` with CASCADE delete (participants removed when channel deleted)
- Foreign key to `users` with CASCADE delete (participant removed when user deleted)

**Business Rules:**
- Multiple participants per channel
- Participants are added automatically based on context (e.g., booking participants)
- Last read timestamp tracks user engagement
- Participants can be added or removed as business context changes
- Messages sent after `last_read_at` are considered unread

CREATE INDEX idx_chat_participants_channel_id ON chat_participants(channel_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_last_read ON chat_participants(channel_id, last_read_at);

### chat_messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag for UI
  deleted_at TIMESTAMP, -- Timestamp when message was soft-deleted
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Technical Constraints:**
- `content` must NOT be NULL
- `is_deleted` defaults to FALSE
- `deleted_at` is nullable (populated when message is soft-deleted)
- Foreign key to `chat_channels` with CASCADE delete (messages removed when channel deleted)
- Foreign key to `users` with CASCADE delete (sender reference maintained but message preserved)
- **Append-Only Constraint:** Messages are immutable once created - Enforced at Application Level (Business Rule: application logic prevents UPDATE/DELETE operations to maintain legal evidence)

**Business Rules:**
- **Append-Only Constraint:** Messages are immutable once created
- **Soft Deletes:** UI can mark messages as deleted (`is_deleted`, `deleted_at`), but data remains in database
- **Hard Data Preservation:** Deleted messages are never physically removed from database
- **Legal Evidence:** Chat history serves as legal evidence for Disputes
- Messages are ordered by `created_at` timestamp
- Content is sanitized but not modified after creation
- Admin views can see all messages including deleted ones

**Soft Delete Behavior:**
- When user "deletes" a message in UI, `is_deleted` is set to `true` and `deleted_at` is set
- Deleted messages are hidden from normal UI views
- Admin views can see all messages including deleted ones
- Deleted messages remain in database for legal/compliance purposes

CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_deleted ON chat_messages(channel_id, is_deleted, created_at DESC) WHERE is_deleted = false;

---

**Back to:** [Database Schema](./schema.md)
