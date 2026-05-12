-- Update fn_create_booking to respect venue_settings for deposits
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
  p_special_mission_id UUID DEFAULT NULL
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
  v_deposit_config      JSONB;
  v_deposit_enabled     BOOLEAN;
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

  -- 2. Compute end time
  v_end_time := (p_start_time + ((p_duration_minutes + v_mission_bonus) || ' minutes')::INTERVAL)::TIME;

  -- 3. Determine base pricing
  IF p_bundle_id IS NOT NULL THEN
    SELECT game_id, duration_minutes, player_count, is_active
      INTO v_bundle_game_id, v_bundle_duration, v_bundle_players, v_bundle_active
    FROM bundles
    WHERE id = p_bundle_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Bundle not found: %', p_bundle_id; END IF;
    IF NOT v_bundle_active THEN RAISE EXCEPTION 'Bundle is not active: %', p_bundle_id; END IF;

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

  -- 4. Add Special Mission Price
  v_total_price := v_total_price + (v_mission_price * p_player_count);

  -- 5. Deposit calculation (from venue_settings)
  v_deposit_config := get_venue_setting('deposit_config');
  v_deposit_enabled := COALESCE((v_deposit_config->>'enabled')::BOOLEAN, false);
  v_deposit_pct := COALESCE((v_deposit_config->>'percentage')::NUMERIC(5,2), 25.00);

  IF v_deposit_enabled THEN
    v_deposit_amount := ROUND(v_total_price * v_deposit_pct / 100.0, 2);
  ELSE
    v_deposit_amount := 0;
  END IF;

  -- 6. Commission (manual bookings only)
  v_commission_amount := NULL;
  v_commission_pct := NULL;
  IF p_source = 'manual' AND p_created_by_user_id IS NOT NULL THEN
    SELECT commission_percentage INTO v_commission_pct
    FROM users WHERE id = p_created_by_user_id;

    IF v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
      v_commission_amount := ROUND(v_total_price * v_commission_pct / 100.0, 2);
    END IF;
  END IF;

  -- 7. Concurrency: Check slots
  IF EXISTS (
    SELECT 1 FROM booking_slots
    WHERE slot_date = p_date AND slot_time >= p_start_time AND slot_time < v_end_time AND released = false
  ) THEN
    RAISE EXCEPTION 'SLOT_CONFLICT: one or more slots already booked'
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 8. Insert Booking
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
    v_deposit_amount, CASE WHEN v_deposit_enabled THEN 'not_tracked' ELSE 'waived' END,
    'confirmed', p_source,
    p_customer_name, p_customer_phone, p_customer_email, p_customer_notes,
    p_created_by_user_id,
    v_commission_pct, v_commission_amount,
    now()
  )
  RETURNING id INTO v_booking_id;

  -- 9. Occupy slots
  v_slot := p_start_time;
  WHILE v_slot < v_end_time LOOP
    INSERT INTO booking_slots (booking_id, slot_date, slot_time)
    VALUES (v_booking_id, p_date, v_slot);
    v_slot := (v_slot + INTERVAL '30 minutes')::TIME;
  END LOOP;

  RETURN QUERY SELECT
    v_booking_id, v_booking_code, v_total_price, v_deposit_amount, v_end_time, v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
