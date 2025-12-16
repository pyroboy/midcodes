-- SECURITY: Admin Audit Logging Table
-- Tracks all administrative actions for compliance and security monitoring

CREATE TABLE IF NOT EXISTS admin_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'organization', 'template', 'credit', 'role', 'settings', 'system')),
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    org_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_audit_admin_id ON admin_audit(admin_id);
CREATE INDEX idx_admin_audit_action ON admin_audit(action);
CREATE INDEX idx_admin_audit_target_type ON admin_audit(target_type);
CREATE INDEX idx_admin_audit_target_id ON admin_audit(target_id);
CREATE INDEX idx_admin_audit_org_id ON admin_audit(org_id);
CREATE INDEX idx_admin_audit_created_at ON admin_audit(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_admin_audit_admin_action ON admin_audit(admin_id, action, created_at DESC);
CREATE INDEX idx_admin_audit_org_action ON admin_audit(org_id, action, created_at DESC);

-- Row Level Security
ALTER TABLE admin_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admins and org_admins can view audit logs for their org
CREATE POLICY "admin_audit_select_policy" ON admin_audit
    FOR SELECT
    USING (
        -- Super admins can see all
        (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'super_admin')
        OR
        -- Org admins can see their org's logs
        (
            org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
            AND (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('org_admin', 'id_gen_admin'))
        )
    );

-- Policy: Only service role can insert (from server-side)
CREATE POLICY "admin_audit_insert_policy" ON admin_audit
    FOR INSERT
    WITH CHECK (true);  -- Service role bypasses RLS anyway

-- Grant permissions
GRANT SELECT ON admin_audit TO authenticated;
GRANT INSERT ON admin_audit TO service_role;

-- Comment for documentation
COMMENT ON TABLE admin_audit IS 'Stores audit trail of all administrative actions for security and compliance';
COMMENT ON COLUMN admin_audit.action IS 'Type of action performed (e.g., role_emulation_start, credit_adjustment)';
COMMENT ON COLUMN admin_audit.target_type IS 'Category of the target entity';
COMMENT ON COLUMN admin_audit.target_id IS 'ID of the target entity (user ID, org ID, etc.)';
COMMENT ON COLUMN admin_audit.metadata IS 'Additional context about the action (old/new values, etc.)';
