/**
 * Validated, typed environment configuration.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   const url = env.NEXT_PUBLIC_SUPABASE_URL  // string (guaranteed)
 *
 * Fails fast at import time if a required var is missing.
 * Optional vars return undefined without crashing.
 */

function requireEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new Error(
            `❌ Missing required environment variable: ${key}\n` +
            `   Add it to .env.local or your deployment config.`
        )
    }
    return value
}

function optionalEnv(key: string): string | undefined {
    return process.env[key] || undefined
}

// ─── Public (available client + server) ─────────────────────────

export const env = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

    // Site
    NEXT_PUBLIC_SITE_URL: optionalEnv('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000',

    // Google Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: optionalEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') ?? '',
} as const

// ─── Server-only (never exposed to client) ──────────────────────

export const serverEnv = {
    // Supabase Admin
    SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

    // Stripe
    STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: optionalEnv('STRIPE_WEBHOOK_SECRET'),

    // SendGrid
    SENDGRID_API_KEY: optionalEnv('SENDGRID_API_KEY'),
    SENDGRID_FROM_EMAIL: optionalEnv('SENDGRID_FROM_EMAIL'),

    // Webhooks / Cron
    VERCEL_CRON_SECRET: optionalEnv('VERCEL_CRON_SECRET'),
    SUPABASE_WEBHOOK_SECRET: optionalEnv('SUPABASE_WEBHOOK_SECRET'),
} as const
