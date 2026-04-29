-- Phase 1: Update status enum constraints
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
  'pending',      -- Created, awaiting deposit
  'confirmed',    -- Deposit paid
  'checked_in',   -- Customer arrived
  'in_progress',  -- Game started
  'completed',    -- Game finished, full payment collected
  'no_show',      -- Customer didn't show up
  'cancelled'     -- Cancelled before game time
));

-- Phase 2: Add occupied_slots to track all 30-min segments
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS occupied_slots TEXT[];
CREATE INDEX IF NOT EXISTS idx_bookings_occupied_slots ON bookings USING GIN (occupied_slots);

-- Phase 3: Add lifecycle tracking columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_amount_paid DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Phase 4: Create or Replace fn_create_booking with occupied_slots logic
CREATE OR REPLACE FUNCTION public.fn_create_booking(
  p_game_id UUID,
  p_bundle_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER,
  p_player_count INTEGER,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'web',
  p_created_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_booking_code TEXT;
  v_price_per_player DECIMAL;
  v_total DECIMAL;
  v_deposit DECIMAL;
  v_occupied_slots TEXT[];
  v_current_time TIME;
  v_slots_needed INTEGER;
  i INTEGER;
BEGIN
  -- 1. Calculate required slots
  v_slots_needed := CEIL(p_duration_minutes::DECIMAL / 30);
  v_occupied_slots := ARRAY[]::TEXT[];
  v_current_time := p_start_time;
  
  FOR i IN 1..v_slots_needed LOOP
    v_occupied_slots := array_append(v_occupied_slots, v_current_time::TEXT);
    v_current_time := v_current_time + INTERVAL '30 minutes';
  END LOOP;

  -- 2. Check for conflicts using occupied_slots overlap
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE booking_date = p_date
    AND status IN ('confirmed', 'pending', 'checked_in', 'in_progress')
    AND occupied_slots && v_occupied_slots
  ) THEN
    RAISE EXCEPTION 'SLOT_CONFLICT: One or more slots are already occupied.';
  END IF;

  -- 3. Get pricing (simplified for this migration, assumes game_pricing table exists)
  -- If you have a different pricing logic, adjust here.
  -- For now, let's try to fetch it or default to 0 if not found.
  SELECT price_per_player INTO v_price_per_player
  FROM game_pricing
  WHERE game_id = p_game_id
  AND duration_minutes = p_duration_minutes
  LIMIT 1;

  IF v_price_per_player IS NULL THEN
    v_price_per_player := 0; -- Fallback
  END IF;

  v_total := v_price_per_player * p_player_count;
  v_deposit := ROUND(v_total * 0.25, 2);

  -- 4. Generate booking code
  v_booking_code := 'WA-' || TO_CHAR(p_date, 'DDMM') || '-' || 
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

  -- 5. Insert booking
  INSERT INTO bookings (
    booking_code,
    game_id,
    bundle_id,
    booking_date,
    start_time,
    duration_minutes,
    player_count,
    customer_name,
    customer_phone,
    customer_email,
    customer_notes,
    total_price_at_booking,
    deposit_amount,
    status,
    source,
    created_by,
    occupied_slots
  ) VALUES (
    v_booking_code,
    p_game_id,
    p_bundle_id,
    p_date,
    p_start_time,
    p_duration_minutes,
    p_player_count,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_customer_notes,
    v_total,
    v_deposit,
    'pending',
    p_source,
    p_created_by_user_id,
    v_occupied_slots
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'booking_code', v_booking_code,
    'total_price', v_total,
    'deposit_amount', v_deposit,
    'occupied_slots', v_occupied_slots
  );
END;
$$;
