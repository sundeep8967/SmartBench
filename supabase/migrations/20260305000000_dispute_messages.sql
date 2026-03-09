-- Create dispute_messages table to support Epic 5.10 Dispute Resolution Chat

CREATE TABLE IF NOT EXISTS public.dispute_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    time_entry_id UUID NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT false,
    evidence_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
---- Users can read messages for time entries associated with their company (either as borrower or lender)
CREATE POLICY "Users can view dispute messages for their company's time entries"
    ON public.dispute_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.time_entries te ON te.id = dispute_messages.time_entry_id
            JOIN public.bookings b ON b.id = te.booking_id
            WHERE cm.user_id = auth.uid()
            AND cm.status = 'Active'
            AND (cm.company_id = b.borrower_company_id OR cm.company_id = b.lender_company_id)
        )
    );

---- Users can insert messages if they are part of the sender company and the time entry belongs to their company
CREATE POLICY "Users can insert dispute messages for their company's time entries"
    ON public.dispute_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.time_entries te ON te.id = time_entry_id
            JOIN public.bookings b ON b.id = te.booking_id
            WHERE cm.user_id = auth.uid()
            AND cm.company_id = sender_company_id
            AND cm.status = 'Active'
            AND (cm.company_id = b.borrower_company_id OR cm.company_id = b.lender_company_id)
        )
    );
