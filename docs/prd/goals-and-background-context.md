# Goals and Background Context

## Goals

- Enable Non-Union construction companies to monetize idle labor by listing workers in a B2B marketplace
- Provide Borrowers with on-demand access to vetted, skilled construction workers
- Create a dual marketplace where companies can operate as both Lenders (selling labor) and Borrowers (buying labor)
- Implement direct Stripe payment processing enabling daily payouts to Lenders while maintaining financial security for Borrowers
- Launch successfully in Minnesota/Wisconsin market with simplified UX for MVP
- Establish trust layer through KYB verification, insurance tracking, and escrow protection
- Enable real-time time tracking with GPS geofencing and verification workflows
- Support both short-term project bookings and long-term labor augmentation with recall rights

## Success Metrics & KPIs

The following key performance indicators will be tracked to measure SmartBench's success. Quantified targets are established below with baseline measurements to be collected during the first 30 days post-launch.

### Baseline Establishment

**Baseline Measurement Period:** First 30 days post-MVP launch  
**Baseline Review:** After 30 days, actual performance data will be used to validate or adjust targets  
**Target Refinement:** Quarterly reviews to align targets with business objectives and market conditions

### Quantified Targets

**Marketplace Health Metrics:**
- **Utilization Rate:** 
  - **MVP Target (Months 1-3):** 15-25% of listed "Benched" hours successfully booked
  - **Post-MVP Target (Months 4-12):** 30-40% utilization rate
  - **Measurement:** Weekly tracking, monthly reporting
- **Fill Rate:** 
  - **MVP Target (Months 1-3):** 20-30% of Borrower search queries result in confirmed bookings
  - **Post-MVP Target (Months 4-12):** 35-45% fill rate
  - **Measurement:** Per-search tracking, weekly aggregation
- **Network Growth:** 
  - **MVP Target (Month 3):** 20-30 active companies (mix of lenders and borrowers)
  - **MVP Target (Month 6):** 50-75 active companies
  - **Post-MVP Target (Month 12):** 150-200 active companies
  - **Measurement:** Monthly active company count (companies with at least one booking or listing in the month)

**Business Impact Metrics:**
- **Churn Reduction:** 
  - **MVP Target (Months 1-6):** Document at least 5 cases where SmartBench enabled employee retention that would have otherwise resulted in layoffs
  - **Post-MVP Target (Months 7-12):** 15-25 documented retention cases
  - **Measurement:** Quarterly survey of Lenders, tracking layoff prevention through platform usage
- **Revenue Generation:** 
  - **MVP Target (Month 3):** $10,000-$20,000 total transaction volume
  - **MVP Target (Month 6):** $50,000-$75,000 total transaction volume
  - **Post-MVP Target (Month 12):** $200,000-$300,000 total transaction volume
  - **Service Fee Revenue (Month 6):** $3,000-$4,500 (30% Service Fee on transaction volume)
  - **Measurement:** Daily transaction tracking, monthly revenue reporting

**Trust & Safety Metrics:**
- **Safety Score:** 
  - **MVP Target:** < 5 incidents or "No-Shows" per 1,000 hours booked
  - **Post-MVP Target:** < 3 incidents per 1,000 hours booked
  - **Measurement:** Incident tracking per booking, monthly calculation
- **Trust Metrics:** 
  - **MVP Target:** < 2% dispute rate (disputes per completed booking)
  - **MVP Target:** Zero documented poaching incidents
  - **Post-MVP Target:** < 1% dispute rate, maintain zero poaching incidents
  - **Measurement:** Dispute tracking system, quarterly poaching survey

**User Engagement Metrics:**
- **Active User Rate:** 
  - **MVP Target (Month 3):** 40-50% of registered companies actively list workers or make bookings
  - **Post-MVP Target (Month 12):** 60-70% active user rate
  - **Measurement:** Monthly active rate (companies with activity in past 30 days)
- **Repeat Usage:** 
  - **MVP Target (Month 6):** 30-40% of companies make multiple bookings or list workers multiple times
  - **Post-MVP Target (Month 12):** 50-60% repeat usage rate
  - **Measurement:** Percentage of companies with 2+ bookings or 2+ listing cycles
- **Platform Adoption:** 
  - **MVP Target (Month 3):** 3-5 new company registrations per week
  - **MVP Target (Month 6):** 5-8 new company registrations per week
  - **Post-MVP Target (Month 12):** 10-15 new company registrations per week
  - **Measurement:** Weekly registration tracking, monthly growth rate calculation

### Target Review & Refinement

**Review Schedule:**
- **Initial Baseline Review:** After 30 days post-launch
- **Quarterly Reviews:** Every 3 months to validate targets against actual performance
- **Annual Strategic Review:** Comprehensive target adjustment based on full year of data

**Refinement Criteria:**
- Targets will be adjusted based on actual market performance and user feedback
- Industry benchmarks and competitive analysis will inform target adjustments
- Business objectives and strategic priorities will guide target prioritization

## User Research & Insights

User needs and pain points are well-understood from industry context and problem definition. The target personas (Solopreneur, Borrowing Admin, Supervisor, Worker) and their core needs are clearly documented throughout this PRD. See [Terminology Glossary](./glossary.md) for standardized terminology. 

**User Research Documentation:** Formal user research findings, interviews, and competitive analysis will be documented in this section as they are conducted. Current understanding of user needs is derived from:
- Industry knowledge of construction labor volatility ("Feast or Famine" cycle)
- Documented pain points: payment terms, liability insurance, employee poaching
- Clear persona definitions with specific roles and responsibilities
- User journey flows documented in functional requirements

**Note:** While formal user research documentation is not yet complete, the PRD demonstrates strong understanding of user needs through comprehensive functional requirements, user stories, and acceptance criteria that directly address identified pain points.

## Background Context

**SmartBench** is a B2B marketplace application designed to solve labor volatility in the construction industry. The construction industry faces a "Feast or Famine" cycle where contractors are rarely at 100% capacity. Small contractors (1-10 employees) are particularly affected—when one employee is idle in a 2-person company, that represents 50% of their workforce sitting unused.

Currently, lending and borrowing employees is only done by contractors who know each other personally, creating risks around payment terms, liability insurance, and employee poaching. SmartBench expands these possibilities by providing a secure, trusted platform for companies that don't have existing relationships.

The system uses a **Unified User Model** where every human is a **User** that can belong to multiple **Companies** through a **Company_Member** relationship. Users are not directly linked to Companies. Permissions are handled via **Roles** (Admin, Manager, Supervisor, Worker) stored in the Company_Member table, allowing a Solopreneur to hold all roles while larger companies can segregate them. This Many-to-Many relationship also supports future scenarios where a worker may belong to multiple companies.

**Key Architecture:** The system utilizes **direct Stripe payment processing** where payments go directly to Stripe and refunds are processed directly back to the customer's payment method via Stripe API. The Service Fee (30%) is added on top of Worker Rate and retained by the platform for Borrower-initiated cancellations.

## State Machines

See [Data Dictionary](../architecture/data-dictionary.md) for authoritative State Machine diagrams and transition rules for:
- Worker State Machine (User_State and Company_Member.status) - See [Identity Domain Data Dictionary](../architecture/data-dictionary-identity.md#worker-state-machine)
- Booking Status State Machine - See [Booking Domain Data Dictionary](../architecture/data-dictionary-booking.md#booking-status-state-machine)

## Data Integrity & Business Rules {#data-integrity--business-rules}

For authoritative business rules, database constraints, and validation logic, refer to [Architecture: Database Schema](../architecture/schema.md) and [Data Dictionary](../architecture/data-dictionary.md).

### Active Insurance Policy Uniqueness {#active-insurance-policy-uniqueness}

**Business Rule:** Only one active insurance policy of each type (General Liability, Workers Compensation) is allowed per company at any given time. This ensures clear coverage status and prevents conflicting policy information.

**Implementation:** The system enforces this rule at the application level by querying existing active policies before allowing a new policy to be activated. When a new policy is activated, any existing active policy of the same type is automatically deactivated.

**Technical Reference:** See [Schema: Identity Domain](../architecture/schema-identity.md#insurance_policies) for complete table definition and constraint details.

## Performance & Scalability Considerations

The SmartBench platform is designed to handle high-volume operations efficiently. Critical query patterns are optimized with composite indexes to ensure fast response times as the platform scales.

### Performance Requirements & Targets

**Baseline Establishment:** Performance targets are based on MVP scope (Minnesota/Wisconsin market, 20-200 active companies). Targets will be validated during load testing and adjusted based on actual usage patterns.

#### Response Time Targets

**User-Facing Operations:**
- **Critical Actions (UI):** 2-3 taps/clicks maximum for critical user actions (booking creation, time clock operations, payment processing)
- **API Response Times (P95 Latency):**
  - **Payment Processing:** < 2 seconds
  - **Booking Creation:** < 1 second
  - **Time Clock Operations (Clock In/Out):** < 500ms
  - **Worker Search:** < 500ms (including filters, faceting, and pagination)
  - **General API Endpoints:** < 1 second

**Database Query Performance (P95 Latency):**
- **Booking Queries:** < 100ms
- **Time Log Queries:** < 50ms
- **Financial Transaction Queries:** < 100ms
- **Insurance Validation Queries:** < 50ms
- **Worker Search Query:** < 200ms (PostgreSQL query)
- **Search Query with Availability Check:** < 300ms (includes NOT EXISTS subquery)

#### Throughput & Capacity Targets

**MVP Phase (Months 1-6):**
- **Concurrent Users:** Support 100+ concurrent active users
- **Booking Creation:** Handle 100+ concurrent booking creation requests
- **Worker Search:** Support 1,000+ search queries per minute
- **Time Log Processing:** Process auto-approval timers for 500+ active shifts simultaneously
- **Weekly Payment Processing:** Process payments for 200+ bookings during Wednesday 10 AM payment window (peak load scenario)
- **API Request Rate:** Handle 5,000+ requests per minute across all endpoints

**Post-MVP Phase (Months 7-12):**
- **Concurrent Users:** Support 500+ concurrent active users
- **Booking Creation:** Handle 500+ concurrent booking creation requests
- **Worker Search:** Support 5,000+ search queries per minute
- **Time Log Processing:** Process auto-approval timers for 2,000+ active shifts simultaneously
- **Weekly Payment Processing:** Process payments for 1,000+ bookings during Wednesday 10 AM payment window
- **API Request Rate:** Handle 25,000+ requests per minute across all endpoints

#### Load Handling & Scalability

**Peak Load Scenarios:**
- **Wednesday 10 AM Payment Processing:** System must handle peak payment processing load without degradation (200+ bookings in MVP, 1,000+ post-MVP)
- **Morning Rush (7-9 AM):** Handle simultaneous clock-in operations for 200+ workers clocking in within 2-hour window
- **Evening Rush (5-7 PM):** Handle simultaneous clock-out operations for 200+ workers clocking out within 2-hour window
- **Search Traffic Spikes:** Handle 10x normal search query volume during peak usage periods

**Scalability Architecture:**
- **Horizontal Scaling:** Architecture supports horizontal scaling of application servers
- **Database Scaling:** Read replicas available for high read-to-write ratio queries (worker search, reporting, analytics)
- **Caching Strategy:** Redis caching for insurance validation (5-minute TTL), worker profile data (5-minute TTL)
- **Connection Pooling:** Database connection pool configured for concurrent request patterns (default: 20 connections, scalable based on load)

#### Resource Utilization Guidelines

**Database:**
- **Connection Pool Usage:** Maintain < 80% connection pool utilization under normal load
- **Query Performance:** < 1% of queries should exceed 1 second execution time
- **Deadlock Rate:** < 0.1% of transactions should experience deadlocks
- **Index Bloat:** Monitor and rebuild indexes with > 30% bloat

**Application Servers:**
- **CPU Usage:** Maintain < 70% CPU utilization under normal load, < 85% under peak load
- **Memory Usage:** Maintain < 80% memory utilization under normal load
- **Response Time Degradation:** Alert when response times exceed 2x baseline

**Cache Performance:**
- **Redis Hit Rate:** Maintain > 80% cache hit rate for cached queries
- **Cache Eviction:** Monitor cache eviction rate to ensure adequate memory allocation

#### Availability & Reliability Targets

**Service Level Objectives (SLOs):**
- **Payment Processing:** 99.9% success rate, 99.9% uptime
- **Booking Creation:** 99.5% success rate
- **Time Clock Operations:** 99.9% success rate, 99.9% uptime
- **Worker Search:** 99% success rate
- **API Availability:** 99.9% uptime (excluding planned maintenance)

**Service Level Agreements (SLAs):**
- **Payment Processing:** < 4 hour resolution for critical payment issues
- **Time Clock:** < 2 hour resolution for time tracking issues
- **API Availability:** < 8 hour resolution for non-critical issues

#### Performance Testing Requirements

**Load Testing Scenarios:**
- **Booking Creation:** Test 100+ concurrent booking creation requests (MVP), 500+ (Post-MVP)
- **Weekly Payment Processing:** Test Wednesday 10 AM payment processing load (200+ bookings MVP, 1,000+ post-MVP)
- **Worker Search:** Test search query performance under high load (1,000+ queries/minute MVP, 5,000+ post-MVP)
- **Time Log Processing:** Test auto-approval timer processing under load (500+ active shifts MVP, 2,000+ post-MVP)

**Performance Test Schedule:**
- **Pre-Release:** Performance testing before major releases
- **Quarterly:** Comprehensive performance testing and optimization review
- **Ad-Hoc:** Performance testing when adding new features or scaling infrastructure

#### Performance Monitoring

**Key Metrics to Monitor:**
- **API Performance:** Request rate, latency (p50, p95, p99), error rate per endpoint
- **Database Performance:** Query latency, connection pool usage, deadlock rate, slow queries (>1 second)
- **Cache Performance:** Redis hit rate, cache eviction rate, memory usage
- **Server Resources:** CPU usage, memory usage, disk I/O, network throughput
- **Business Metrics:** Booking creation rate, payment success rate, time clock success rate

**Alerting Thresholds:**
- **Response Time:** Alert when P95 latency exceeds 2x target
- **Error Rate:** Alert when error rate exceeds 1% for critical operations
- **Resource Utilization:** Alert when CPU > 85% or memory > 90%
- **Database:** Alert on deadlocks, connection pool exhaustion, or queries exceeding 1 second

**Technical Reference:** For detailed performance optimization strategies, composite index definitions, query optimization requirements, and performance monitoring specifications, see:
- [Architecture: Performance Optimization](../architecture/performance-optimization.md)
- [Architecture: Observability & Monitoring](../architecture/observability-monitoring.md)

---