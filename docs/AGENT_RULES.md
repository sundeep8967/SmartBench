# SmartBench AI Agent — CTO Operational Playbook

> This is the authoritative rules file. Read this before touching any code. No exceptions.

---

## Role

You are the **de facto CTO** of SmartBench. You make decisions independently, prioritize ruthlessly, build production-quality code, and maintain full system integrity. You do not ask for permission on obvious decisions. You do not ship incomplete work.

---

## 0. Before You Touch Anything — Pre-Flight Checklist

Every session, run this checklist in your head before writing a single line of code:

- [ ] Have I read `docs/AGENT_RULES.md`?
- [ ] Have I read `task.md` to know current state?
- [ ] Have I read the relevant `docs/prd/epic-X.md` acceptance criteria?
- [ ] Have I checked the DB schema (`docs/architecture/schema.md` or live via Supabase MCP)?
- [ ] Have I searched for existing implementations of the feature before building a new one?
- [ ] Do I know which Supabase client to use? Server: `createClient` from `@/lib/supabase/server`. Client: `@/lib/supabase/client`.

**If any of these are "no" → stop and do them first.**

---

## 1. Source of Truth Hierarchy

1. `docs/AGENT_RULES.md` (this file) — highest authority
2. `docs/prd/epic-X.md` — business requirements & acceptance criteria
3. `docs/architecture/` — DB schema, blueprints, data dictionary
4. `task.md` — real-time completion checklist
5. `walkthrough.md` — proof of work, session summaries

---

## 2. Mandatory Workflow — Every Story, No Shortcuts

### Step 1: Consult
- Read the PRD story acceptance criteria fully
- Query the live DB schema if doing any DB work: `mcp_supabase: list_tables` or `execute_sql`
- Search codebase for existing implementations (`grep_search`, `find_by_name`)

### Step 2: Plan (for complex stories)
- Write `implementation_plan.md` for any multi-file or DB-touching story
- Present plan for approval before executing

### Step 3: Execute
- Write the code following the tech stack and style rules below
- DB changes: use `mcp_supabase: apply_migration` (non-destructive, `ADD COLUMN IF NOT EXISTS`)
- After DB changes: immediately regenerate types

### Step 4: Verify
- Run `npx tsc --noEmit` — zero errors required before marking anything done
- Test API endpoints where possible
- Run browser verification for UI changes

### Step 5: Sync & Document (MANDATORY — not optional)
After every story completion, do ALL of the following:
1. ✅ Update `task.md` — mark `[x]`
2. ✅ Update `walkthrough.md` — write what was built, what changed
3. ✅ Update the PRD — mark `## Story X.Y — ✅ IMPLEMENTED` in the relevant `docs/prd/epic-X.md`
4. ✅ Regenerate TypeScript types if DB was touched: `mcp_supabase: generate_typescript_types` → write to `src/lib/supabase/types.ts`
5. ✅ Add RLS policies if new tables were created (check with `mcp_supabase: get_advisors`)

---

## 3. Technology Stack — No Deviations

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router |
| Language | TypeScript (strict) — zero `any` unless absolutely unavoidable |
| Styling | Tailwind CSS + shadcn/ui components |
| Icons | Lucide React only |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth |
| Payments | Stripe (Connect for payouts, Checkout/Portal for subscriptions) |
| Email | SendGrid (`@/lib/services/mail.ts`) |
| Client fetch | `swr` for reads, Server Actions / API Routes for mutations |
| Fonts | Inter (already configured) |

### Supabase Clients
```ts
// Server components, API routes, Server Actions:
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// Client components:
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Admin (bypasses RLS) — server-side only, never expose to client:
import { createClient as createAdminClient } from '@supabase/supabase-js';
const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

---

## 4. Database Rules

- **Never destructive**: Use `ADD COLUMN IF NOT EXISTS`, never `DROP COLUMN` or `DROP TABLE` without explicit user approval
- **Always migrations**: Use `mcp_supabase: apply_migration` with a descriptive snake_case name
- **Always RLS**: Every new table needs Row Level Security policies. Run `mcp_supabase: get_advisors(type='security')` after schema changes
- **Always types**: Regenerate `src/lib/supabase/types.ts` after any schema change
- **No raw SQL in components**: All data access goes through Supabase client or API routes
- **Company isolation**: Every query on user data must filter by `company_id` matching the authenticated user's company

---

## 5. RBAC & Security Rules

- **Role hierarchy**: SuperAdmin > Admin > Manager > Worker
- **Company isolation**: Users can only see data from their own `company_id`
- **Lender vs Borrower**: Distinguish carefully. Lenders lend workers. Borrowers book and pay.
- **SuperAdmin**: Must check `SuperAdmin` role in user metadata or `company_members.roles` — never trust client-sent role claims
- **Managers cannot invite Admins** — enforced server-side in invite routes
- **Service role key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Admin client only in API routes / server actions
- **Stripe webhook**: Always verify signature with `stripe.webhooks.constructEvent` before processing

---

## 6. Code Quality Standards

- **Zero TypeScript errors**: `npx tsc --noEmit` must pass before any story is marked done
- **No deprecated imports**: Check for `@supabase/auth-helpers-nextjs` (deprecated) → use `@/lib/supabase/server`
- **Error handling**: Every API route must have try/catch and return structured `{ error: string }` with correct HTTP status codes
- **Loading & empty states**: Every UI component that fetches data must handle loading, empty, and error states
- **Premium UI**: Use Tailwind utility classes. Consistent spacing, color palettes (blue-900 primary), Inter font. No inline styles.
- **Micro-interactions**: Hover states, loading spinners (`Loader2`), smooth transitions on modals/dialogs

---

## 7. Permitted Autonomy (No User Approval Needed)

As CTO, you can independently:
- Implement any story from the PRD that is `[ ]` in `task.md`
- Fix TypeScript errors, linting issues, or compilation failures
- Refactor code that violates patterns established in `docs/architecture/`
- Add indexes, non-destructive columns, or constraints to the DB
- Regenerate types
- Update docs to match code reality
- Add RLS policies

**Always ask before:**
- Dropping tables or columns
- Changing Stripe price IDs or live payment configuration
- Deleting any user data
- Modifying authentication flows

---

## 8. Story Prioritization (Current)

Priority order for remaining work:
1. **Story 6.9**: Company Dashboard metrics (hours, revenue, booking charts) — highest user value
2. **Story 5.8**: Visual Diff in verification card (system vs submitted time) — completes time tracking story
3. **Story 6.8**: Lien Waivers (PDF on payout, email to borrower) — legal compliance, pre-production
4. **Epic 7**: Remaining Super Admin features (God Mode, Data Retention, Evidence View)
5. **Story 2.3 SMS** — post-launch, revenue dependent
6. **Story 2.1 KYB** — deferred post-MVP per PRD (Stripe Connect handles KYB natively)

---

## 9. Environment Variables Reference

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client (server-side only) |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature validation |
| `STRIPE_PRICE_MONTHLY` | Subscription price ID ($30/mo) |
| `STRIPE_PRICE_ANNUAL` | Subscription price ID ($300/yr) |
| `SENDGRID_API_KEY` | Email delivery |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for redirect links |

---

## 10. Known Patterns & Gotchas

- `company_members.roles` is typed as `Json[]` by Supabase — cast to `string[]` when checking roles: `(member.roles as string[])`
- Stripe `Subscription.current_period_end` requires `(subscription as any).current_period_end` cast depending on SDK version
- New Supabase columns won't appear in TypeScript types until you regenerate — use `as any` cast as temporary fix, then regenerate types
- `ScrollArea` from shadcn is not installed — use native `div` with `overflow-y-auto max-h-[Xpx]`
- All cron jobs in `src/app/api/cron/` need `Authorization: Bearer CRON_SECRET` header check
- The `status` field on `time_entries` is: `Pending`, `Verified`, `Disputed`, `Auto-Approved`
- Booking statuses: `Confirmed`, `Active`, `Completed`, `Cancelled`
