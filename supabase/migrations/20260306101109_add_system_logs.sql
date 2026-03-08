-- supabase/migrations/20260306101109_add_system_logs.sql

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Super Admins can see all logs
CREATE POLICY "SuperAdmins can view all system logs"
    ON system_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.user_id = auth.uid()
            AND company_members.roles ? 'SuperAdmin'
        )
    );

-- Super Admins can update logs (resolve)
CREATE POLICY "SuperAdmins can update system logs"
    ON system_logs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.user_id = auth.uid()
            AND company_members.roles ? 'SuperAdmin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_members
            WHERE company_members.user_id = auth.uid()
            AND company_members.roles ? 'SuperAdmin'
        )
    );

-- System services can insert logs (this policy might be bypassing RLS if inserted from a trusted backend, but good to have)
CREATE POLICY "Service roles can insert system logs"
    ON system_logs
    FOR INSERT
    WITH CHECK (true); -- Usually inserts will come from server-side service_role key, which bypasses RLS anyway

-- Indexes for performance
CREATE INDEX IF NOT EXISTS system_logs_level_idx ON system_logs(level);
CREATE INDEX IF NOT EXISTS system_logs_service_idx ON system_logs(service);
CREATE INDEX IF NOT EXISTS system_logs_resolved_idx ON system_logs(resolved);
CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON system_logs(created_at DESC);
