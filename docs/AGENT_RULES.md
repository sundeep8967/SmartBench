# SmartBench AI Agent Rules

This file establishes the core directives and operational constraints for any AI agent or coding assistant operating within the SmartBench repository. 

**CRITICAL DIRECTIVE:** You must review this file and the `task.md` file before beginning any new feature implementation or bug fix.

## 1. Source of Truth & Progress Tracking
- **`task.md` and `walkthrough.md`:** These files (located in the `.gemini/antigravity/brain/...` directory or project root) are the real-time sources of truth for implementation progress.
- **Always update `task.md`:** When completing a story or task, mark it as `[x]` and add `✅` or `✅ NEW` to reflect the current state.
- **Maintain Documentation Sync:** The `docs/` folder contains the PRD, UX, and Architecture blueprints. **Whenever a feature is implemented, you MUST update the corresponding `docs/` files to match reality.** Do not let the code and the documentation drift out of sync.

## 2. Implementation Workflow
1. **Consult PRD:** Before writing code, read the relevant `docs/prd/epic-X.md` to understand the business requirements and acceptance criteria.
2. **Consult Architecture:** Review `docs/architecture/schema.md` and specific blueprints to ensure your database models and API contracts align with the established design patterns.
3. **Plan:** Write an `implementation_plan.md` for any complex story. Have the user approve it before executing.
4. **Execute:** Write the code, run migrations (`npx supabase db push`), and generate types.
5. **Verify:** Test the API endpoints or frontend components.
6. **Sync & Document:** Update `task.md`, write a summary in `walkthrough.md`, and **update the `docs/` folder** to mark the epic/story as implemented or annotate any deviations from the original plan.

## 3. Technology & Style Constraints
- **Framework:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS, shadcn/ui components, Lucide icons.
- **Database:** Supabase (PostgreSQL). Always use Row Level Security (RLS) policies.
- **Data Fetching:** Use `swr` for client-side data fetching and Server Actions / API Routes for mutations.
- **Aesthetics:** Prioritize clean, modern, "premium" UI interactions. Use appropriate whitespace, typography (Inter/sans-serif), and micro-interactions.

## 4. Database Schema Rules
- Never make destructive changes without explicit user permission.
- Always create a new migration file in `supabase/migrations/` rather than modifying existing ones once they are applied.
- Ensure TypeScript types are generated and kept in sync via `npx supabase gen types typescript --project-id ... > src/lib/supabase/types.ts` (or the MCP equivalent).

## 5. Security & Roles
- **RBAC:** Enforce strict Role-Based Access Control. Users are isolated by `company_id`.
- **Lender vs. Borrower:** Distinguish carefully between Lender companies (workers) and Borrower companies (clients).
- **SuperAdmin:** Super Admin features must explicitly check for the `SuperAdmin` role in the `company_members` table or user metadata.
