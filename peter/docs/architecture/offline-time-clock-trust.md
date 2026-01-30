# D. Offline Time Clock & Supervisor Verification

**Decision:** We use a simple "Supervisor Verification" model for offline sync. The Supervisor is required to be on-site, and their verification is the ultimate truth. We do not need code to detect time manipulation; the Supervisor will catch it.

**Core Principle:** The Supervisor is required to be on-site. Therefore, the Supervisor's verification is the ultimate truth. We do not need code to detect time manipulation; the Supervisor will catch it.

**Implementation Details:** See [Time Tracking Verification Blueprint](./blueprints/fulfillment/time-tracking-verification.md) for time tracking flow, Negotiation Loop logic, sync protocols, and verification flow diagrams.

**Schema Reference:** See [schema.md](./schema.md) for `time_log` and `time_log_offline_sync` table definitions.
