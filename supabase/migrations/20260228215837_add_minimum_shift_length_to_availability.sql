-- Migration: Add minimum_shift_length_hours to worker_availability table
ALTER TABLE worker_availability
ADD COLUMN minimum_shift_length_hours INTEGER;
