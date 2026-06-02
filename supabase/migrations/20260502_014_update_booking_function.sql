-- Migration 014: Update fn_create_booking for Special Missions
-- Author: Warriors Arena

CREATE OR REPLACE FUNCTION fn_create_booking(
  p_game_id           UUID,
  p_bundle_id         UUID,
  p_date              DATE,
  p_start_time        TIME,
  p_duration_minutes  INT,
  p_player_count      INT,
  p_customer_name     TEXT,
  p_customer_phone    TEXT,
  p_customer_email    TEXT,
  p_customer_notes    TEXT,
  p_source            TEXT,
  p_created_by_user_id UUID,
  p_special_mission_id UUID DEFAULT NULL  -- NEW
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
  v_mission_price       NUMERIC(10,2) := 0;
  v_mission_bonus       INT := 0;
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

  -- 1. Resolve Special Mission (if any)
  IF p_special_mission_id IS NOT NULL THEN
    SELECT additional_price_per_player, duration_bonus_minutes
      INTO v_mission_price, v_mission_bonus
    FROM special_missions
    WHERE id = p_special_mission_id AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Special mission not found or inactive';
    END IF;
  END IF;

  -- 2. Compute end time (including mission bonus)
  v_end_time := (p_start_time + ((p_duration_minutes + v_mission_bonus) || ' minutes')::INTERVAL)::TIME;

  -- 3. Validate against operating hours
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

  -- 4. Determine base pricing
  IF p_bundle_id IS NOT NULL THEN
    SELECT game_id, duration_minutes, player_count, is_active
      INTO v_bundle_game_id, v_bundle_duration, v_bundle_players, v_bundle_active
    FROM bundles
    WHERE id = p_bundle_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Bundle not found: %', p_bundle_id; END IF;
    IF NOT v_bundle_active THEN RAISE EXCEPTION 'Bundle is not active: %', p_bundle_id; END IF;
    IF v_bundle_game_id != p_game_id THEN RAISE EXCEPTION 'Bundle game mismatch'; END IF;
    IF v_bundle_duration != p_duration_minutes THEN RAISE EXCEPTION 'Bundle duration mismatch'; END IF;
    IF v_bundle_players != p_player_count THEN RAISE EXCEPTION 'Bundle player count mismatch'; END IF;

    v_total_price := fn_bundle_total_price(p_bundle_id);
    v_price_per_player := NULL;
  ELSE
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

  -- 5. Add Special Mission Price
  v_total_price := v_total_price + (v_mission_price * p_player_count);

  -- 6. Deposit amount
  SELECT (value->>'percentage')::NUMERIC(5,2) INTO v_deposit_pct
  FROM system_settings WHERE key = 'deposit_percentage';

  v_deposit_pct := COALESCE(v_deposit_pct, 25.00);
  v_deposit_amount := ROUND(v_total_price * v_deposit_pct / 100.0, 2);

  -- 7. Commission (manual bookings only)
  v_commission_amount := NULL;
  v_commission_pct := NULL;
  IF p_source = 'manual' AND p_created_by_user_id IS NOT NULL THEN
    SELECT commission_percentage INTO v_commission_pct
    FROM users WHERE id = p_created_by_user_id;

    IF v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
      v_commission_amount := ROUND(v_total_price * v_commission_pct / 100.0, 2);
    END IF;
  END IF;

  -- 8. Concurrency: Lock target slot rows
  PERFORM 1 FROM booking_slots
  WHERE slot_date = p_date AND slot_time >= p_start_time AND slot_time < v_end_time AND released = false
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM booking_slots
    WHERE slot_date = p_date AND slot_time >= p_start_time AND slot_time < v_end_time AND released = false
  ) THEN
    RAISE EXCEPTION 'SLOT_CONFLICT: one or more slots already booked'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 9. Insert Booking
  v_booking_code := fn_generate_booking_code(p_date);

  INSERT INTO bookings (
    booking_code, game_id, bundle_id, special_mission_id,
    booking_date, start_time, end_time, duration_minutes,
    player_count,
    price_per_player_at_booking, mission_additional_price, total_price_at_booking,
    deposit_amount, deposit_status,
    status, source,
    customer_name, customer_phone, customer_email, customer_notes,
    created_by_user_id,
    commission_percentage, commission_amount,
    confirmed_at
  ) VALUES (
    v_booking_code, p_game_id, p_bundle_id, p_special_mission_id,
    p_date, p_start_time, v_end_time, p_duration_minutes + v_mission_bonus,
    p_player_count,
    v_price_per_player, v_mission_price, v_total_price,
    v_deposit_amount, 'not_tracked',
    'confirmed', p_source,
    p_customer_name, p_customer_phone, p_customer_email, p_customer_notes,
    p_created_by_user_id,
    v_commission_pct, v_commission_amount,
    now()
  )
  RETURNING id INTO v_booking_id;

  -- 10. Occupy slots
  v_slot := p_start_time;
  WHILE v_slot < v_end_time LOOP
    INSERT INTO booking_slots (booking_id, slot_date, slot_time)
    VALUES (v_booking_id, p_date, v_slot);
    v_slot := (v_slot + INTERVAL '30 minutes')::TIME;
  END LOOP;

  RETURN QUERY SELECT
    v_booking_id, v_booking_code, v_total_price, v_deposit_amount, v_end_time, v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

GRANT EXECUTE ON FUNCTION fn_create_booking(UUID, UUID, DATE, TIME, INT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated, service_role;
