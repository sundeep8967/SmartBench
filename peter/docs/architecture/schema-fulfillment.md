# Database Schema - Fulfillment Domain

**Version:** 1.0  
**Last Updated:** January 2026  
**Part of:** [Database Schema](./schema.md)

This document contains complete SQL table definitions, constraints, indexes, and foreign keys for the Fulfillment domain. All technical schema information should reference this file.

**For human-readable business concepts and entity definitions, see [Data Dictionary - Fulfillment Domain](./data-dictionary-fulfillment.md).**

---

## Fulfillment Domain

### time_log

```sql
CREATE TABLE time_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_in_time TIMESTAMP NOT NULL,
  clock_out_time TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'Working',
    -- ENUM: 'Working', 'Break', 'Lunch', 'Travel_Time', 'Pending_Verification', 'Pending_Worker_Review', 'Pending_Supervisor_Reevaluation', 'Pending_Supervisor_Verification', 'Verified', 'Disputed'
  gps_coordinates POINT, -- nullable, may be NULL if GPS unavailable
  project_photo_url TEXT, -- nullable
  submitted_time_start TIMESTAMP, -- nullable, worker's edited version
  submitted_time_end TIMESTAMP, -- nullable, worker's edited version
  verified_at TIMESTAMP,
  supervisor_id UUID REFERENCES users(id),
  auto_approval_time TIMESTAMP, -- Stores calculated deadline (Event Time + 4 Hours) for Negotiation Loop auto-approval
  last_editor_id UUID REFERENCES users(id), -- Tracks who made the last change (Worker or Supervisor) to determine whose turn it is to approve
  supervisor_edit_note TEXT, -- Stores supervisor's note when editing time (required for edits)
  worker_rejection_comment TEXT, -- Stores worker's comment when rejecting edit (required for rejections)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_log_booking_id ON time_log(booking_id);
CREATE INDEX idx_time_log_worker_id ON time_log(worker_id);
CREATE INDEX idx_time_log_status ON time_log(status);
CREATE INDEX idx_time_log_clock_in_time ON time_log(clock_in_time);
CREATE INDEX idx_time_log_verified_metrics ON time_log(worker_id, status, clock_in_time, clock_out_time, verified_at) 
  WHERE status = 'Verified';
CREATE INDEX idx_time_log_auto_approval_time ON time_log(auto_approval_time) 
  WHERE status IN ('Pending_Worker_Review', 'Pending_Supervisor_Reevaluation', 'Pending_Supervisor_Verification');
```

**Technical Constraints:**
- `status` ENUM: 'Working', 'Break', 'Lunch', 'Travel_Time', 'Pending_Verification', 'Pending_Worker_Review', 'Pending_Supervisor_Reevaluation', 'Pending_Supervisor_Verification', 'Verified', 'Disputed'
  - `Pending_Worker_Review`: Step 2 of Negotiation Loop - Supervisor edited time, worker must accept or reject
  - `Pending_Supervisor_Reevaluation`: Step 3 of Negotiation Loop - Worker rejected supervisor's edit, supervisor must correct or file dispute
  - `Pending_Supervisor_Verification`: **NOT part of Negotiation Loop** - Used exclusively for worker retroactive entries (manual timesheet submissions due to bad signal, device loss, etc.). This status is separate from the Negotiation Loop workflow and follows a direct supervisor verification path (approve or dispute) with 4-hour auto-approval timer. See [Data Dictionary - Fulfillment Domain](./data-dictionary-fulfillment.md#c-worker-retroactive-flow) for complete worker retroactive entry workflow.
  - **Migration Note:** If `Pending_Supervisor_Final_Review` status exists in production database from previous implementation, it must be removed via database migration as part of the Simplified MVP refactor (January 2026). This status was replaced with the Negotiation Loop statuses (`Pending_Worker_Review`, `Pending_Supervisor_Reevaluation`). See [Architecture Index - Migration Notes](./index.md#migration-notes) for complete migration details.
- `gps_coordinates` may be NULL if GPS unavailable during offline clock-in
- `auto_approval_time` stores calculated deadline (Event Time + 4 Hours) for Negotiation Loop auto-approval. Timer resets to 4 hours when status changes to `Pending_Worker_Review` or `Pending_Supervisor_Reevaluation`
- `last_editor_id` tracks who made the last change (Worker or Supervisor) to determine whose turn it is to approve
- **Future Shift Representation:** Future/scheduled shifts are represented as pre-created `time_log` records with future `clock_in_time` values. These records are created when the booking is confirmed or when shifts are scheduled, allowing the system to query and cancel future shifts (e.g., during weekly payment hard cutoff or insurance expiration). These pre-created records have `status = 'Working'` or another appropriate status until the worker actually clocks in.
- **Metrics Support:** Index on verified shifts supports On-Time Reliability % and Fast Verifier metric calculations
- **Auto-Approval Support:** Index on `auto_approval_time` enables efficient background job queries for pending approvals

### time_log_offline_sync

```sql
CREATE TABLE time_log_offline_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  device_timestamp BIGINT NOT NULL, -- Unix timestamp (milliseconds)
  server_received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  gps_coordinates POINT,
  project_photo_url TEXT,
  sync_status VARCHAR(50) NOT NULL, -- ENUM: 'pending', 'synced', 'failed', 'conflict'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_log_offline_sync_worker_id ON time_log_offline_sync(worker_id);
CREATE INDEX idx_time_log_offline_sync_sync_status ON time_log_offline_sync(sync_status);
```

**Technical Constraints:**
- `sync_status` ENUM: 'pending', 'synced', 'failed', 'conflict'
  - `'pending'`: Event stored locally, awaiting sync
  - `'synced'`: Event successfully synced to server
  - `'failed'`: Sync attempt failed, requires retry
  - `'conflict'`: Sync conflict detected (worker offline entry conflicts with supervisor Force Clock Out), requires supervisor resolution

---

**Back to:** [Database Schema](./schema.md)
