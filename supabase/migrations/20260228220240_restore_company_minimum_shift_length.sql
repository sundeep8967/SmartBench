-- Migration: Add missing minimum_shift_length_hours to companies table
ALTER TABLE companies
ADD COLUMN minimum_shift_length_hours INTEGER DEFAULT 8;
