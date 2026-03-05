-- Migration: Add stripe_customer_id to companies
-- This stores the Stripe Customer ID for borrowers so they can save payment methods (Cards on File).

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;
