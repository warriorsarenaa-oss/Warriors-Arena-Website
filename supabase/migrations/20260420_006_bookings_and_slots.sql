-- Migration 006: Bookings and Slot Occupation
-- Author: Warriors Arena
-- Notes: The core transactional tables. Slot exclusivity is venue-wide (D5).

-- ============================================
-- bookings
-- ============================================
CREATE TABLE bookings (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code                    TEXT UNIQUE NOT NULL,
  game_id                         UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  bundle_id                       UUID REFERENCES bundles(id) ON DELETE RESTRICT,
  booking_date                    DATE NOT NULL,
  start_time                      TIME NOT NULL,
  end_time                        TIME NOT NULL,
  duration_minutes                INT NOT NULL CHECK (duration_minutes IN (30, 60)),
  player_count                    INT NOT NULL CHECK (player_count >= 1 AND player_count <= 50),  -- 50 ceiling for manual override safety
  price_per_player_at_booking     NUMERIC(10,2),
  total_price_at_booking          NUMERIC(10,2) NOT NULL CHECK (total_price_at_booking > 0),
  deposit_amount                  NUMERIC(10,2),
  deposit_status                  TEXT NOT NULL DEFAULT 'not_tracked'
                                  CHECK (deposit_status IN ('not_tracked', 'pending', 'confirmed', 'refunded', 'forfeited')),
  currency_at_booking             TEXT NOT NULL DEFAULT 'EGP',
  status                          TEXT NOT NULL
                                  CHECK (status IN (
                                    'confirmed', 'completed', 'cancelled',
                                    'pending_deposit', 'cancelled_refunded', 'cancelled_forfeited',
                                    'cancelled_by_admin', 'auto_cancelled', 'no_show', 'rescheduled'
                                  )),
  source                          TEXT NOT NULL CHECK (source IN ('online', 'manual')),
  customer_name                   TEXT NOT NULL CHECK (length(trim(customer_name)) > 0),
  customer_phone                  TEXT NOT NULL CHECK (length(trim(customer_phone)) > 0),
  customer_email                  TEXT,
  customer_notes                  TEXT,
  created_by_user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  commission_percentage           NUMERIC(5,2),
  commission_amount               NUMERIC(10,2),
  hold_expires_at                 TIMESTAMPTZ,
  confirmed_at                    TIMESTAMPTZ,
  cancelled_at                    TIMESTAMPTZ,
  cancellation_reason             TEXT CHECK (cancellation_reason IN (
                                    'customer_request', 'no_deposit_received', 'customer_no_show',
                                    'venue_issue', 'staff_error', 'other'
                                  )),
  cancellation_note               TEXT,
  cancelled_by_user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at                    TIMESTAMPTZ,
  rescheduled_to_booking_id       UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Manual booking must have created_by_user_id
  CHECK (source = 'online' OR created_by_user_id IS NOT NULL),

  -- Cancellation reason required when cancelled
  CHECK (status NOT LIKE 'cancelled%' OR cancellation_reason IS NOT NULL),

  -- 'other' reason requires note
  CHECK (cancellation_reason IS NULL OR cancellation_reason != 'other' OR cancellation_note IS NOT NULL),

  -- end_time must be after start_time
  CHECK (end_time > start_time),

  -- Bundle bookings: price_per_player_at_booking can be NULL (fixed_total mode)
  -- Standard bookings: price_per_player_at_booking should be set
  CHECK (bundle_id IS NOT NULL OR price_per_player_at_booking IS NOT NULL)
);

CREATE INDEX idx_bookings_date_time ON bookings(booking_date, start_time);
CREATE INDEX idx_bookings_status_date ON bookings(status, booking_date);
CREATE INDEX idx_bookings_creator_date ON bookings(created_by_user_id, booking_date)
  WHERE created_by_user_id IS NOT NULL;
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_hold_expiry ON bookings(hold_expires_at)
  WHERE status = 'pending_deposit';

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE bookings IS 'Reservation records. v1 uses confirmed/completed/cancelled only. Other statuses reserved for v1.1+.';
COMMENT ON COLUMN bookings.total_price_at_booking IS 'Snapshot at booking time. Immutable. Reports use this, never JOIN to current pricing.';

-- ============================================
-- booking_slots — venue-wide slot occupation
-- ============================================
-- Per BR-SLOT-06 (D5): slot exclusivity is venue-wide. NO game_id column here.
-- The booking row knows the game; this table only tracks "is this 30-min window taken?"
CREATE TABLE booking_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  slot_date   DATE NOT NULL,
  slot_time   TIME NOT NULL,
  released    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- THE database-level guarantee against double-booking.
-- Per D5: a (date, time) pair can be occupied by AT MOST one active booking, regardless of game.
CREATE UNIQUE INDEX idx_active_slot_occupation
  ON booking_slots(slot_date, slot_time)
  WHERE released = false;

CREATE INDEX idx_booking_slots_booking ON booking_slots(booking_id);
CREATE INDEX idx_booking_slots_date_time ON booking_slots(slot_date, slot_time);

COMMENT ON TABLE booking_slots IS 'Venue-wide slot occupation. Unique partial index enforces no overlap on active slots.';

-- ============================================
-- RLS — anon never reads bookings or slots directly
-- ============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
-- No anon policies. Public availability reads go through fn_get_availability RPC.
-- Authenticated reads go through the API with permission checks.

-- ============================================
-- Booking code generator
-- ============================================
CREATE OR REPLACE FUNCTION fn_generate_booking_code(p_date DATE)
RETURNS TEXT AS $$
DECLARE
  v_dd_mm TEXT;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- excludes O, 0, I, 1
  v_suffix TEXT;
  v_code TEXT;
  v_attempt INT := 0;
  v_exists BOOLEAN;
BEGIN
  v_dd_mm := to_char(p_date, 'DDMM');

  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt > 5 THEN
      RAISE EXCEPTION 'Could not generate unique booking code after 5 attempts';
    END IF;

    v_suffix := '';
    FOR i IN 1..4 LOOP
      v_suffix := v_suffix || substr(v_chars, (floor(random() * length(v_chars)) + 1)::INT, 1);
    END LOOP;

    v_code := 'WA-' || v_dd_mm || '-' || v_suffix;

    SELECT EXISTS (SELECT 1 FROM bookings WHERE booking_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION fn_generate_booking_code IS 'Generates WA-DDMM-XXXX code. Retries on collision. Excludes O/0/I/1.';
