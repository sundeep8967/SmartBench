---
description: Tech context and architecture decisions - READ THIS FIRST before any implementation work
---

# SmartBench — Tech Context (Read Before Every Task)

> **RULE:** Before proposing ANY implementation, cross-reference this document against the architecture spec.
> If the spec says to build something that is already handled by an existing service listed below, FLAG IT to the user instead of blindly implementing it.

## Project Overview

SmartBench is a construction labor marketplace platform built using the **BMad Method v6** framework.
All documentation lives in `/docs` and follows the BMad structure:
- PRD: `docs/prd/` (epics, stories, acceptance criteria)
- Architecture: `docs/architecture/` (schemas, blueprints, tech stack)
- UX: `docs/ux/` (navigation, front-end spec)
- Entry point: `docs/index.md`

## Actual Tech Stack (What We Use)

| Layer | Spec Says | What We Actually Use | Impact |
|-------|-----------|---------------------|--------|
| **Auth** | Custom JWT + NestJS | **Supabase Auth** | Do NOT build: refresh_tokens, password_reset_tokens, magic_link_tokens, webauthn tables |
| **Database** | PostgreSQL + Drizzle ORM | **Supabase Postgres** (direct SQL) | Use Supabase MCP tools for migrations. RLS is managed via Supabase dashboard |
| **Backend** | NestJS (Dockerized) | **Next.js API Routes** | API routes live in `src/app/api/` |
| **Frontend** | Next.js 14 App Router | **Next.js App Router** ✅ matches | — |
| **Payments** | Stripe Connect Express | **Stripe Connect Express** ✅ matches | KYB/KYC handled by Stripe, not us |
| **ORM** | Drizzle ORM | **Supabase JS Client** (direct queries) | No Drizzle setup yet |

## What Supabase Already Handles (DO NOT BUILD)

These are managed internally by Supabase in its `auth` schema:
- ❌ `refresh_tokens` → `auth.refresh_tokens`
- ❌ `password_reset_tokens` → `auth.flow_state`
- ❌ `magic_link_tokens` → `auth.flow_state`
- ❌ `webauthn_credentials` → `auth.mfa_factors`
- ❌ `webauthn_challenges` → `auth.mfa_challenges`
- ❌ Session management → Supabase handles cookie/token rotation
- ❌ OAuth flows → Supabase handles Google Sign-In

## What Stripe Already Handles (DO NOT BUILD)

- ❌ KYB/KYC verification → Stripe Connect Hosted Onboarding
- ❌ Identity document verification → Stripe Identity
- ❌ Bank account verification → Stripe handles during onboarding
- ❌ Sanctions/OFAC screening → Stripe does this automatically

## Current Database State

### Existing Tables (public schema)
1. `users` — simplified (id, email, full_name, company_id FK, role, onboarding_step)
2. `companies` — simplified (id, name, ein, address, kyb_status, type, member_count, stripe_account_id)
3. `profiles` — legacy/unused (0 rows, can be dropped)

### Target Schema (from docs/architecture/schema-identity.md)
- `users` — needs: mobile_number, user_state, password_hash, stripe_identity_id
- `companies` — needs: all policy fields (break, lunch, OT, trial, no-show)
- `company_members` — junction table (replaces users.company_id direct FK)
- `insurance_policies` — Epic 2
- `user_preferences` — defer
- `onboarding_sessions` — defer (using localStorage)
- `user_agreements` — Epic 2

## Supabase Project

- **Project ID:** `fgiiiaaladescndihyqn`
- **Region:** us-west-1

## Environment Variables

Located in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `STRIPE_SECRET_KEY` — Original Stripe key
- `STRIPE_SECRET_KEY_SANDBOX` — Sandbox key (currently active in code)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_SANDBOX`

## Key Architecture Rules

1. **Spec vs Reality:** The architecture docs were written for a custom NestJS backend. We use Supabase + Next.js. Always filter specs through this reality.
2. **Monetary Values:** Store as BIGINT (cents), use Dinero.js for calculations — NEVER floats.
3. **Timestamps:** All stored in UTC.
4. **RLS:** All multi-tenant tables must have Row Level Security enabled.
5. **Epic Order:** Epic 1 → 1.1 → 2 → 3 → 4 → 5 → 6 (sequential). Epic 7 can run in parallel.

## Checklist Before Proposing Work

- [ ] Read this file
- [ ] Read the relevant epic/story from `docs/prd/`
- [ ] Read the relevant schema from `docs/architecture/schema-*.md`
- [ ] Cross-check: Is any part already handled by Supabase Auth or Stripe?
- [ ] Cross-check: Does the spec assume NestJS? Adapt for Next.js API Routes
- [ ] Only THEN propose the implementation plan
