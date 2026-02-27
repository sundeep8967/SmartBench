/**
 * Re-exports from auto-generated database types.
 * Use `Tables<'table_name'>` for row types.
 *
 * For custom/joined types, define them here extending the generated types.
 */
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'
import type { Tables } from './database.types'

// ─── Convenient aliases ─────────────────────────────────────────

export type Project = Tables<'projects'>
export type WorkOrder = Tables<'work_orders'>
export type WorkerProfile = Tables<'worker_profiles'>
export type CartItem = Tables<'cart_items'>
export type Company = Tables<'companies'>
export type CompanyMember = Tables<'company_members'>
export type Booking = Tables<'bookings'>
export type User = Tables<'users'>
export type Notification = Tables<'notifications'>
export type TimeEntry = Tables<'time_entries'>

// ─── Joined / Custom types ──────────────────────────────────────

/** CartItem with joined work_order, worker_profile, and worker user data */
export interface CartItemWithDetails extends CartItem {
    work_order?: WorkOrder & { project?: Project }
    worker_profile?: WorkerProfile
    worker?: {
        full_name: string
        email?: string
    }
}
