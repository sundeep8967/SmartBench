import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ workerId: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const params = await context.params;
        const workerId = params.workerId;
        const body = await req.json();
        const {
            bookingId,
            aggregateRating,
            punctualityRating,
            attitudeRating,
            effortRating,
            teamworkRating,
            testimonialText
        } = body;

        if (!bookingId || !aggregateRating || !punctualityRating || !attitudeRating || !effortRating || !teamworkRating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the caller is associated with the borrower company for this booking
        const { data: companyUser } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
        }

        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, borrower_company_id, status')
            .eq('id', bookingId)
            .eq('worker_id', workerId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found or does not belong to this worker' }, { status: 404 });
        }

        if (booking.borrower_company_id !== (companyUser as any).company_id) {
            return NextResponse.json({ error: 'You are not authorized to review this booking' }, { status: 403 });
        }

        // Ensure booking is completed (or you can relax this logic if required)
        // Insert review
        const { error: insertError } = await (supabase as any).from('worker_reviews')
            .insert({
                worker_id: workerId,
                booking_id: bookingId,
                reviewer_id: user.id,
                aggregate_rating: aggregateRating,
                punctuality_rating: punctualityRating,
                attitude_rating: attitudeRating,
                effort_rating: effortRating,
                teamwork_rating: teamworkRating,
                testimonial_text: testimonialText || null
            });

        if (insertError) {
            if (insertError.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'A review already exists for this booking' }, { status: 409 });
            }
            throw insertError;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error submitting review:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ workerId: string }> }
) {
    const supabase = await createClient();

    try {
        const params = await context.params;
        const workerId = params.workerId;

        // 1. Check if the worker allows public testimonials
        const { data: workerOpts, error: workerErr } = await supabase
            .from('users')
            .select('allow_public_testimonials')
            .eq('id', workerId)
            .single();

        if (workerErr) throw workerErr;

        // 2. Fetch all reviews for the worker
        const { data: reviews, error: reviewsErr } = await (supabase as any).from('worker_reviews')
            .select(`
                id,
                aggregate_rating,
                punctuality_rating,
                attitude_rating,
                effort_rating,
                teamwork_rating,
                testimonial_text,
                created_at,
                reviewer:users!worker_reviews_reviewer_id_fkey(full_name),
                booking:bookings!inner(project:projects(title))
            `)
            .eq('worker_id', workerId)
            .order('created_at', { ascending: false });

        if (reviewsErr) throw reviewsErr;

        // 3. Optional: Filter out text and reviewer identity if public testimonials are disabled
        const allowPublic = (workerOpts as any)?.allow_public_testimonials === true;

        const formattedReviews = reviews.map((r: any) => ({
            id: r.id,
            aggregate_rating: r.aggregate_rating,
            punctuality_rating: r.punctuality_rating,
            attitude_rating: r.attitude_rating,
            effort_rating: r.effort_rating,
            teamwork_rating: r.teamwork_rating,
            created_at: r.created_at,
            // Only provide text and context if allowed
            testimonial_text: allowPublic ? r.testimonial_text : null,
            reviewer_name: allowPublic ? r.reviewer?.full_name : null,
            project_title: allowPublic ? r.booking?.project?.title : null
        }));

        // 4. Calculate averages
        const total = formattedReviews.length;
        const averages = total > 0 ? {
            aggregate: (formattedReviews.reduce((sum: number, r: any) => sum + r.aggregate_rating, 0) / total).toFixed(1),
            punctuality: (formattedReviews.reduce((sum: number, r: any) => sum + r.punctuality_rating, 0) / total).toFixed(1),
            attitude: (formattedReviews.reduce((sum: number, r: any) => sum + r.attitude_rating, 0) / total).toFixed(1),
            effort: (formattedReviews.reduce((sum: number, r: any) => sum + r.effort_rating, 0) / total).toFixed(1),
            teamwork: (formattedReviews.reduce((sum: number, r: any) => sum + r.teamwork_rating, 0) / total).toFixed(1),
        } : null;

        return NextResponse.json({
            success: true,
            allowPublic,
            totalReviews: total,
            averages,
            reviews: formattedReviews
        });
    } catch (err: any) {
        console.error('Error fetching reviews:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
