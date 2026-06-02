-- 1. Create arena_events table
CREATE TABLE IF NOT EXISTS arena_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  total_revenue NUMERIC(10,2) NOT NULL CHECK (total_revenue > 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_arena_events_date ON arena_events(event_date);
CREATE INDEX idx_arena_events_deleted ON arena_events(is_deleted) WHERE is_deleted = false;

-- 3. updated_at trigger
CREATE TRIGGER trg_arena_events_updated_at
  BEFORE UPDATE ON arena_events
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 4. RLS: Enable, service-role only
ALTER TABLE arena_events ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE arena_events IS 'B2B events and corporate bookings. Soft-delete via is_deleted, never hard DELETE.';
