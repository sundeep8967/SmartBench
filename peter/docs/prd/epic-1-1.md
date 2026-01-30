# Epic 1.1: Project Management

**Epic Goal:** Enable borrowers to create, edit, and manage projects. Projects are persistent entities that exist independent of bookings and serve as the parent entity for all bookings. This epic delivers the project management functionality required before bookings can be created.

## Story 1.1.1: Create Project

As a Borrowing Admin,
I want to create a new project with name, address, and timezone,
so that I can organize bookings under a specific project.

**Acceptance Criteria:**
1. API endpoint `POST /projects` accepts: Name, Address, Timezone
2. "Create Project" screen in Borrower Dashboard with form fields: Project Name, Address (Street, City, State, Zip), Timezone (dropdown). Timezone dropdown defaults to borrower's company default timezone, or browser timezone if company default not set.
3. System validates required fields and creates Project record
4. Project is immediately available for selection in booking workflow
5. Borrower can view created project in project list

## Story 1.1.2: Edit Project

As a Borrowing Admin,
I want to edit project details (name, address, timezone),
so that I can update project information as needed.

**Acceptance Criteria:**
1. API endpoint `PUT /projects/:id` accepts: Name, Address, Timezone
2. "Edit Project" screen in Borrower Dashboard
3. System validates required fields and updates Project record
4. Changes are reflected immediately in booking workflow
5. Historical bookings retain original project data (immutable)

## Story 1.1.3: View/List Projects

As a Borrowing Admin,
I want to view a list of all my projects,
so that I can manage and select projects for bookings.

**Acceptance Criteria:**
1. API endpoint `GET /projects` returns list of projects for authenticated borrower's company
2. "Projects" screen in Borrower Dashboard displays project list
3. List shows: Project Name, Address, Timezone, Number of Bookings, Created Date
4. Borrower can filter and search projects
5. Borrower can navigate to project details from list

## Story 1.1.4: Delete Project

As a Borrowing Admin,
I want to delete projects that are no longer needed,
so that I can manage my project list and remove obsolete projects.

**Acceptance Criteria:**
1. API endpoint `DELETE /projects/:id` deletes project if deletion constraints are met
2. "Delete Project" action available in project list and project details screens
3. System validates deletion constraints before allowing deletion
4. Confirmation dialog warns user about deletion consequences
5. Project is permanently deleted if constraints are met

**Project Deletion Constraints:**

Projects with active bookings cannot be deleted. The system enforces the following constraints:

- **Active Bookings Check:** Projects with bookings in active statuses cannot be deleted. Active statuses include:
  - `Pending_Payment` - Booking payment is pending
  - `Confirmed` - Booking is confirmed but not yet started
  - `Active` - Booking is currently active with ongoing shifts
  - Payment failures keep booking status `Active` until hard cutoff (Wednesday 11:59 PM) when worker is released
  - `Disputed` - Booking has active disputes
  - `Payment_Paused_Dispute` - Weekly payment paused due to Option A dispute. Booking remains Active, workers CAN clock in. Only affects payment processing, not worker access.

- **Error Message:** If deletion is attempted on a project with active bookings, the system returns error: "Cannot delete project with active bookings. Please complete or cancel all active bookings first."

- **Completed/Cancelled Bookings:** Projects with only completed or cancelled bookings can be deleted. When a project is deleted:
  - All associated bookings are cascade deleted (per `ON DELETE CASCADE` foreign key constraint in `bookings` table - see [Schema - Booking Domain](../architecture/schema-booking.md))
  - Historical financial data (payment records in Stripe) remains accessible for audit and compliance purposes

- **Cascade Behavior:** When a project is deleted, the following cascade behaviors apply:
  - Bookings: All bookings associated with the project are deleted (`ON DELETE CASCADE`)
  - Time Logs: Time logs associated with deleted bookings are preserved (time_log references bookings with appropriate foreign key behavior)
  - Ratings: Ratings associated with deleted bookings are deleted (`ON DELETE CASCADE` on ratings table)
  - Financial Records: Payment records are maintained in Stripe and `pending_payments` table for audit purposes

**Business Rules:**
- Project deletion is permanent and cannot be undone
- Historical booking data (financial transactions, time logs) is preserved for audit and compliance
- Only Borrowing Admins can delete projects (authorization enforced at API level)

---

## Related Documentation

- [Epic 1: Foundation & Core Infrastructure](./epic-1.md) - Company and user management
- [Epic 4: Booking & Payment Processing](./epic-4.md) - Booking creation (requires project selection)
- [Architecture Blueprint: Error Handling](../architecture/blueprints/system/error-handling.md) - Error handling patterns and user messages
- [Data Dictionary: Booking Domain](../architecture/data-dictionary-booking.md) - Project entity definitions
- [Customer Journey: Borrower Journey](./customer-journey.md#borrower-journey) - Project creation in booking workflow

---