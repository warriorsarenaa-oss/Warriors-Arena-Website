-- Migration 022: Ensure venue_settings and reload schema
CREATE TABLE IF NOT EXISTS venue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO venue_settings (key, value)
VALUES 
  ('deposit_config', '{"enabled": false, "percentage": 25}'),
  ('park_entrance_config', '{"regular_price": 30, "holiday_price": 50}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE OR REPLACE FUNCTION get_venue_setting(p_key TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN (SELECT value FROM venue_settings WHERE key = p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
