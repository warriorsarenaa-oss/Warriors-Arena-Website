-- Audit Logs Standardization
-- Migration to pluralize and ensure structure

-- 1. Create or Rename table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_log') AND 
     NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE audit_log RENAME TO audit_logs;
  ELSIF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE TABLE audit_logs (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_email   TEXT,
      action        TEXT NOT NULL, -- e.g., 'create_booking', 'cancel_booking'
      entity_type   TEXT NOT NULL, -- e.g., 'bookings', 'games'
      entity_id     TEXT NOT NULL, -- ID or Code of affected entity
      before_state  JSONB,
      after_state   JSONB,
      ip_address    TEXT,
      user_agent    TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at DESC);

-- 3. RLS (Only admins can read)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id IS NOT NULL));

GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated, service_role;
