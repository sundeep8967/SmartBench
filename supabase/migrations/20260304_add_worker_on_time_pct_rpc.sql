-- Migration: add_worker_on_time_pct_rpc
-- PRD Story 3.1: On-Time Reliability % badge
-- Formula: (clock-ins within 5 min of scheduled start) / total verified shifts * 100
--
-- Forward-compatible: if time_log table doesn't exist yet (Epic 5 pending), 
-- the API's try/catch handles it gracefully.

CREATE OR REPLACE FUNCTION get_worker_on_time_pct(worker_ids UUID[])
RETURNS TABLE (
    worker_id UUID,
    on_time_pct NUMERIC,
    total_shifts BIGINT,
    on_time_shifts BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        tl.worker_id,
        CASE
            WHEN COUNT(*) = 0 THEN NULL
            ELSE ROUND(
                (COUNT(*) FILTER (
                    WHERE tl.clock_in_time <= (b.start_time + INTERVAL '5 minutes')
                )::NUMERIC / COUNT(*)::NUMERIC) * 100,
                1
            )
        END AS on_time_pct,
        COUNT(*) AS total_shifts,
        COUNT(*) FILTER (
            WHERE tl.clock_in_time <= (b.start_time + INTERVAL '5 minutes')
        ) AS on_time_shifts
    FROM time_log tl
    JOIN bookings b ON b.id = tl.booking_id
    WHERE tl.worker_id = ANY(worker_ids)
      AND tl.status IN ('Verified', 'Pending_Verification')
    GROUP BY tl.worker_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_worker_on_time_pct(UUID[]) TO authenticated;
