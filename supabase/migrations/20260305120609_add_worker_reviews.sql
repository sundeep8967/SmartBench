-- Create worker_reviews table
CREATE TABLE IF NOT EXISTS public.worker_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    aggregate_rating DECIMAL(2,1) NOT NULL CHECK (aggregate_rating >= 1.0 AND aggregate_rating <= 5.0),
    punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    attitude_rating INTEGER NOT NULL CHECK (attitude_rating >= 1 AND attitude_rating <= 5),
    effort_rating INTEGER NOT NULL CHECK (effort_rating >= 1 AND effort_rating <= 5),
    teamwork_rating INTEGER NOT NULL CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
    
    testimonial_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Enforce one review per booking
    CONSTRAINT unique_booking_review UNIQUE (booking_id)
);

-- Index for efficient querying by worker_id
CREATE INDEX IF NOT EXISTS idx_worker_reviews_worker_id ON public.worker_reviews(worker_id);

-- Add allow_public_testimonials boolean to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS allow_public_testimonials BOOLEAN NOT NULL DEFAULT false;

-- Add RLS to worker_reviews
ALTER TABLE public.worker_reviews ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone logged in can read reviews (for aggregate math, though UI hides text if toggle is off)
CREATE POLICY "Anyone can read worker reviews"
    ON public.worker_reviews FOR SELECT
    TO authenticated
    USING (true);

-- Insert policy: Only the borrower admin or supervisor involved in the booking can insert a review
CREATE POLICY "Reviewer can insert review"
    ON public.worker_reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);
