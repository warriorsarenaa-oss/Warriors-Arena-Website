-- Migration 005: Operating Hours, System Settings, Bundles
-- Author: Warriors Arena
-- Notes: Configuration tables. All public-readable.

-- ============================================
-- operating_hours
-- ============================================
CREATE TABLE operating_hours (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope               TEXT NOT NULL CHECK (scope IN ('default', 'day_of_week', 'exact_date')),
  day_of_week         INT CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0 = Sunday
  exact_date          DATE,
  open_time           TIME,
  close_time          TIME,
  is_closed           BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope-specific column requirements
  CHECK (
    (scope = 'default'      AND day_of_week IS NULL AND exact_date IS NULL)
    OR (scope = 'day_of_week' AND day_of_week IS NOT NULL AND exact_date IS NULL)
    OR (scope = 'exact_date'  AND day_of_week IS NULL AND exact_date IS NOT NULL)
  ),

  -- If not closed, both open and close required
  CHECK (
    (is_closed = true)
    OR (is_closed = false AND open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)
  )
);

-- One default config max
CREATE UNIQUE INDEX idx_operating_hours_default
  ON operating_hours(scope) WHERE scope = 'default';

-- One per day-of-week
CREATE UNIQUE INDEX idx_operating_hours_dow
  ON operating_hours(day_of_week) WHERE scope = 'day_of_week';

-- One per exact date
CREATE UNIQUE INDEX idx_operating_hours_exact
  ON operating_hours(exact_date) WHERE scope = 'exact_date';

CREATE TRIGGER trg_operating_hours_updated_at
  BEFORE UPDATE ON operating_hours
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE operating_hours IS 'Three-level priority: exact_date > day_of_week > default. Resolved by fn_resolve_operating_hours.';

-- ============================================
-- Operating hours resolution function
-- ============================================
CREATE OR REPLACE FUNCTION fn_resolve_operating_hours(p_date DATE)
RETURNS TABLE (
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN,
  source_scope TEXT
) AS $$
BEGIN
  -- Priority 1: exact date
  RETURN QUERY
  SELECT oh.open_time, oh.close_time, oh.is_closed, 'exact_date'::TEXT
  FROM operating_hours oh
  WHERE oh.scope = 'exact_date' AND oh.exact_date = p_date
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Priority 2: day of week (0 = Sunday in PostgreSQL EXTRACT(DOW))
  RETURN QUERY
  SELECT oh.open_time, oh.close_time, oh.is_closed, 'day_of_week'::TEXT
  FROM operating_hours oh
  WHERE oh.scope = 'day_of_week' AND oh.day_of_week = EXTRACT(DOW FROM p_date)::INT
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Priority 3: default
  RETURN QUERY
  SELECT oh.open_time, oh.close_time, oh.is_closed, 'default'::TEXT
  FROM operating_hours oh
  WHERE oh.scope = 'default'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_resolve_operating_hours IS 'Returns the resolved operating hours for a given date, applying exact_date > day_of_week > default priority.';

-- ============================================
-- system_settings
-- ============================================
CREATE TABLE system_settings (
  key                 TEXT PRIMARY KEY,
  value               JSONB NOT NULL,
  description         TEXT,
  updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE system_settings IS 'Key-value store for venue configuration: deposit %, contact info, fees.';

-- Public read for non-sensitive settings (whitelist via RLS)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_anon_read_public ON system_settings
  FOR SELECT TO anon USING (key IN (
    'deposit_percentage',
    'whatsapp_number',
    'instapay_identifier',
    'park_entry_fee_regular',
    'park_entry_fee_holiday',
    'contact_phone',
    'contact_email'
  ));

CREATE POLICY system_settings_authenticated_read ON system_settings
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- bundles
-- ============================================
CREATE TABLE bundles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  title_en            TEXT NOT NULL,
  title_ar            TEXT NOT NULL,
  description_en      TEXT,
  description_ar      TEXT,
  game_id             UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  duration_minutes    INT NOT NULL CHECK (duration_minutes IN (30, 60)),
  player_count        INT NOT NULL CHECK (player_count BETWEEN 1 AND 6),
  pricing_mode        TEXT NOT NULL CHECK (pricing_mode IN ('per_player', 'fixed_total')),
  price_value         NUMERIC(10,2) NOT NULL CHECK (price_value > 0),
  currency            TEXT NOT NULL DEFAULT 'EGP',
  display_placement   TEXT CHECK (display_placement IN ('landing_featured', 'landing_secondary', 'booking_flow_sidebar', 'hidden')),
  image_url           TEXT,
  is_visible          BOOLEAN NOT NULL DEFAULT true,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  display_order       INT NOT NULL DEFAULT 0,
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_bundles_visible_order
  ON bundles(is_visible, is_active, display_placement, display_order)
  WHERE is_visible = true AND is_active = true;

CREATE INDEX idx_bundles_game_id ON bundles(game_id);

CREATE TRIGGER trg_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE bundles IS 'Pre-configured booking offers. pricing_mode controls how price_value is interpreted.';
COMMENT ON COLUMN bundles.pricing_mode IS 'per_player: total = price_value * player_count. fixed_total: total = price_value.';

-- ============================================
-- Bundle effective price helper
-- ============================================
CREATE OR REPLACE FUNCTION fn_bundle_total_price(p_bundle_id UUID)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_mode TEXT;
  v_value NUMERIC(10,2);
  v_players INT;
BEGIN
  SELECT pricing_mode, price_value, player_count
    INTO v_mode, v_value, v_players
  FROM bundles
  WHERE id = p_bundle_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bundle not found: %', p_bundle_id;
  END IF;

  IF v_mode = 'per_player' THEN
    RETURN v_value * v_players;
  ELSE
    RETURN v_value;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS for bundles
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY bundles_anon_read ON bundles
  FOR SELECT TO anon USING (is_visible = true AND is_active = true);
CREATE POLICY bundles_authenticated_read ON bundles
  FOR SELECT TO authenticated USING (true);
