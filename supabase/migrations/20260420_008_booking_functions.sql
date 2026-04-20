-- Migration 008: Atomic Booking Creation and Availability Functions
-- Author: Warriors Arena
-- Notes: These are the most critical functions in the system. Changes here need extreme care.

-- ============================================
-- fn_get_availability
-- Public read of slot availability for a given date.
-- Per D5, slots are venue-wide (no game_id parameter).
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_availability(p_date DATE)
RETURNS TABLE (
  slot_time         TIME,
  available_30      BOOLEAN,
  available_60      BOOLEAN,
  reason            TEXT  -- NULL if available, else: 'booked', 'closing', 'past'
) AS $$
DECLARE
  v_open            TIME;
  v_close           TIME;
  v_is_closed       BOOLEAN;
  v_slot            TIME;
  v_next_slot       TIME;
  v_is_booked       BOOLEAN;
  v_next_booked     BOOLEAN;
  v_now_cairo       TIMESTAMPTZ := (now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo';
  v_slot_datetime   TIMESTAMPTZ;
BEGIN
  -- Resolve operating hours for the date
  SELECT rh.open_time, rh.close_time, rh.is_closed
    INTO v_open, v_close, v_is_closed
  FROM fn_resolve_operating_hours(p_date) rh;

  -- Closed day: return empty
  IF v_is_closed OR v_open IS NULL OR v_close IS NULL THEN
    RETURN;
  END IF;

  -- Iterate through 30-min slots from open to close
  v_slot := v_open;
  WHILE v_slot < v_close LOOP
    -- Check if this slot is currently booked
    SELECT EXISTS (
      SELECT 1 FROM booking_slots
      WHERE slot_date = p_date
        AND slot_time = v_slot
        AND released = false
    ) INTO v_is_booked;

    -- Compute next slot (for 60-min availability check)
    v_next_slot := (v_slot + INTERVAL '30 minutes')::TIME;

    -- Check if the next slot is booked (needed for 60-min)
    IF v_next_slot < v_close THEN
      SELECT EXISTS (
        SELECT 1 FROM booking_slots
        WHERE slot_date = p_date
          AND slot_time = v_next_slot
          AND released = false
      ) INTO v_next_booked;
    ELSE
      -- Next slot is beyond closing
      v_next_booked := true;
    END IF;

    -- Check if slot is in the past
    v_slot_datetime := (p_date + v_slot) AT TIME ZONE 'Africa/Cairo';

    RETURN QUERY SELECT
      v_slot AS slot_time,
      (NOT v_is_booked AND v_slot_datetime > v_now_cairo) AS available_30,
      -- 60-min available means: this slot free, next slot free, and this slot + 60 min <= close
      (NOT v_is_booked AND NOT v_next_booked
       AND (v_slot + INTERVAL '60 minutes')::TIME <= v_close
       AND v_slot_datetime > v_now_cairo) AS available_60,
      CASE
        WHEN v_slot_datetime <= v_now_cairo THEN 'past'
        WHEN v_is_booked THEN 'booked'
        WHEN (v_slot + INTERVAL '60 minutes')::TIME > v_close THEN 'closing'
        ELSE NULL
      END AS reason;

    v_slot := v_next_slot;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_get_availability IS 'Returns slot availability for a date. Venue-wide (D5). Respects operating hours and current time.';

GRANT EXECUTE ON FUNCTION fn_get_availability(DATE) TO anon, authenticated;

-- ============================================
-- fn_create_booking
-- Atomic booking creation. Single source of truth for all booking inserts.
-- ============================================
CREATE OR REPLACE FUNCTION fn_create_booking(
  p_game_id           UUID,
  p_bundle_id         UUID,                -- NULL for standard booking
  p_date              DATE,
  p_start_time        TIME,
  p_duration_minutes  INT,
  p_player_count      INT,
  p_customer_name     TEXT,
  p_customer_phone    TEXT,
  p_customer_email    TEXT,
  p_customer_notes    TEXT,
  p_source            TEXT,                -- 'online' or 'manual'
  p_created_by_user_id UUID                -- NULL for online bookings
)
RETURNS TABLE (
  booking_id        UUID,
  booking_code      TEXT,
  total_price       NUMERIC(10,2),
  deposit_amount    NUMERIC(10,2),
  end_time          TIME,
  commission_amount NUMERIC(10,2)
) AS $$
DECLARE
  v_booking_id          UUID;
  v_booking_code        TEXT;
  v_end_time            TIME;
  v_slot_count          INT;
  v_slot                TIME;
  v_price_per_player    NUMERIC(10,2);
  v_total_price         NUMERIC(10,2);
  v_deposit_pct         NUMERIC(5,2);
  v_deposit_amount      NUMERIC(10,2);
  v_commission_pct      NUMERIC(5,2);
  v_commission_amount   NUMERIC(10,2);
  v_open                TIME;
  v_close               TIME;
  v_is_closed           BOOLEAN;
  v_bundle_game_id      UUID;
  v_bundle_duration     INT;
  v_bundle_players      INT;
  v_bundle_active       BOOLEAN;
BEGIN
  -- Validate inputs
  IF p_duration_minutes NOT IN (30, 60) THEN
    RAISE EXCEPTION 'Invalid duration: %. Must be 30 or 60.', p_duration_minutes;
  END IF;

  IF p_player_count < 1 THEN
    RAISE EXCEPTION 'Invalid player count: %', p_player_count;
  END IF;

  IF p_source NOT IN ('online', 'manual') THEN
    RAISE EXCEPTION 'Invalid source: %', p_source;
  END IF;

  IF p_source = 'manual' AND p_created_by_user_id IS NULL THEN
    RAISE EXCEPTION 'Manual bookings require created_by_user_id';
  END IF;

  IF p_source = 'online' AND p_player_count > 6 THEN
    RAISE EXCEPTION 'Online bookings capped at 6 players. Got: %', p_player_count;
  END IF;

  -- Compute end time
  v_end_time := (p_start_time + (p_duration_minutes || ' minutes')::INTERVAL)::TIME;

  -- Validate against operating hours
  SELECT rh.open_time, rh.close_time, rh.is_closed
    INTO v_open, v_close, v_is_closed
  FROM fn_resolve_operating_hours(p_date) rh;

  IF v_is_closed OR v_open IS NULL OR v_close IS NULL THEN
    RAISE EXCEPTION 'Venue is closed on %', p_date;
  END IF;

  IF p_start_time < v_open OR v_end_time > v_close THEN
    RAISE EXCEPTION 'Slot % to % outside operating hours (% to %)',
      p_start_time, v_end_time, v_open, v_close;
  END IF;

  -- Determine pricing
  IF p_bundle_id IS NOT NULL THEN
    -- Bundle booking: validate bundle matches request
    SELECT game_id, duration_minutes, player_count, is_active
      INTO v_bundle_game_id, v_bundle_duration, v_bundle_players, v_bundle_active
    FROM bundles
    WHERE id = p_bundle_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Bundle not found: %', p_bundle_id;
    END IF;

    IF NOT v_bundle_active THEN
      RAISE EXCEPTION 'Bundle is not active: %', p_bundle_id;
    END IF;

    IF v_bundle_game_id != p_game_id THEN
      RAISE EXCEPTION 'Bundle game mismatch';
    END IF;

    IF v_bundle_duration != p_duration_minutes THEN
      RAISE EXCEPTION 'Bundle duration mismatch';
    END IF;

    IF v_bundle_players != p_player_count THEN
      RAISE EXCEPTION 'Bundle player count mismatch';
    END IF;

    v_total_price := fn_bundle_total_price(p_bundle_id);
    v_price_per_player := NULL;  -- bundles may use fixed_total
  ELSE
    -- Standard booking: look up active price
    SELECT price_per_player INTO v_price_per_player
    FROM game_pricing
    WHERE game_id = p_game_id
      AND duration_minutes = p_duration_minutes
      AND is_active = true
    LIMIT 1;

    IF v_price_per_player IS NULL THEN
      RAISE EXCEPTION 'No active pricing for game % duration %', p_game_id, p_duration_minutes;
    END IF;

    v_total_price := v_price_per_player * p_player_count;
  END IF;

  -- Deposit amount
  SELECT (value->>'percentage')::NUMERIC(5,2)
    INTO v_deposit_pct
  FROM system_settings
  WHERE key = 'deposit_percentage';

  v_deposit_pct := COALESCE(v_deposit_pct, 25.00);
  v_deposit_amount := ROUND(v_total_price * v_deposit_pct / 100.0, 2);

  -- Commission (manual bookings only)
  v_commission_amount := NULL;
  v_commission_pct := NULL;
  IF p_source = 'manual' AND p_created_by_user_id IS NOT NULL THEN
    SELECT commission_percentage
      INTO v_commission_pct
    FROM users
    WHERE id = p_created_by_user_id;

    IF v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
      v_commission_amount := ROUND(v_total_price * v_commission_pct / 100.0, 2);
    END IF;
  END IF;

  -- Lock the target slot rows. Use SELECT FOR UPDATE on a predicate that matches
  -- the unique index's WHERE clause to correctly serialize concurrent attempts.
  -- This prevents phantom inserts between check and insert.
  PERFORM 1
  FROM booking_slots
  WHERE slot_date = p_date
    AND slot_time >= p_start_time
    AND slot_time < v_end_time
    AND released = false
  FOR UPDATE;

  -- Check for conflicts
  IF EXISTS (
    SELECT 1 FROM booking_slots
    WHERE slot_date = p_date
      AND slot_time >= p_start_time
      AND slot_time < v_end_time
      AND released = false
  ) THEN
    RAISE EXCEPTION 'SLOT_CONFLICT: one or more slots already booked'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Generate booking code
  v_booking_code := fn_generate_booking_code(p_date);

  -- Insert the booking row
  INSERT INTO bookings (
    booking_code, game_id, bundle_id,
    booking_date, start_time, end_time, duration_minutes,
    player_count,
    price_per_player_at_booking, total_price_at_booking,
    deposit_amount, deposit_status,
    status, source,
    customer_name, customer_phone, customer_email, customer_notes,
    created_by_user_id,
    commission_percentage, commission_amount,
    confirmed_at
  ) VALUES (
    v_booking_code, p_game_id, p_bundle_id,
    p_date, p_start_time, v_end_time, p_duration_minutes,
    p_player_count,
    v_price_per_player, v_total_price,
    v_deposit_amount, 'not_tracked',
    'confirmed',  -- v1: bookings are immediately confirmed
    p_source,
    p_customer_name, p_customer_phone, p_customer_email, p_customer_notes,
    p_created_by_user_id,
    v_commission_pct, v_commission_amount,
    now()
  )
  RETURNING id INTO v_booking_id;

  -- Insert slot occupation rows.
  -- The unique partial index is the hard guarantee: if a concurrent transaction
  -- inserted a conflicting slot between our SELECT FOR UPDATE and this INSERT,
  -- this will fail with unique_violation and the whole txn rolls back.
  v_slot := p_start_time;
  WHILE v_slot < v_end_time LOOP
    INSERT INTO booking_slots (booking_id, slot_date, slot_time)
    VALUES (v_booking_id, p_date, v_slot);
    v_slot := (v_slot + INTERVAL '30 minutes')::TIME;
  END LOOP;

  -- Return the booking details
  RETURN QUERY SELECT
    v_booking_id,
    v_booking_code,
    v_total_price,
    v_deposit_amount,
    v_end_time,
    v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

COMMENT ON FUNCTION fn_create_booking IS 'Atomic booking creation. The ONLY path to insert bookings. Uses SELECT FOR UPDATE + unique index for concurrency safety.';

-- Only authenticated (for admin manual bookings) and service role (for public API) should call this
-- Anon calls this via the API server using service role
GRANT EXECUTE ON FUNCTION fn_create_booking(UUID, UUID, DATE, TIME, INT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;

-- ============================================
-- fn_cancel_booking
-- Cancels a booking and releases its slots. Requires reason.
-- ============================================
CREATE OR REPLACE FUNCTION fn_cancel_booking(
  p_booking_id          UUID,
  p_cancelled_by_user_id UUID,
  p_reason              TEXT,
  p_note                TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Lock the booking row
  SELECT status INTO v_current_status
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  IF v_current_status != 'confirmed' THEN
    RAISE EXCEPTION 'Cannot cancel booking in status: %', v_current_status;
  END IF;

  IF p_reason NOT IN ('customer_request', 'no_deposit_received', 'customer_no_show',
                      'venue_issue', 'staff_error', 'other') THEN
    RAISE EXCEPTION 'Invalid cancellation reason: %', p_reason;
  END IF;

  IF p_reason = 'other' AND (p_note IS NULL OR length(trim(p_note)) = 0) THEN
    RAISE EXCEPTION 'Note is required when reason is "other"';
  END IF;

  -- Update booking
  UPDATE bookings
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by_user_id = p_cancelled_by_user_id,
      cancellation_reason = p_reason,
      cancellation_note = p_note
  WHERE id = p_booking_id;

  -- Release slots (flip, don't delete — preserves history)
  UPDATE booking_slots
  SET released = true
  WHERE booking_id = p_booking_id
    AND released = false;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

COMMENT ON FUNCTION fn_cancel_booking IS 'Cancels a confirmed booking, captures reason, and releases slots. v1 cancellation path.';

GRANT EXECUTE ON FUNCTION fn_cancel_booking(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;

-- ============================================
-- fn_complete_bookings_due (cron)
-- Transitions confirmed bookings to completed after their slot + grace period.
-- ============================================
CREATE OR REPLACE FUNCTION fn_complete_bookings_due()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  WITH updated AS (
    UPDATE bookings
    SET status = 'completed',
        completed_at = now()
    WHERE status = 'confirmed'
      AND (booking_date + end_time + INTERVAL '30 minutes') AT TIME ZONE 'Africa/Cairo' <= now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

COMMENT ON FUNCTION fn_complete_bookings_due IS 'Cron: flips confirmed → completed when slot end + 30 min grace has passed.';

GRANT EXECUTE ON FUNCTION fn_complete_bookings_due() TO service_role;
