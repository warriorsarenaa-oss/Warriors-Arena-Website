-- Fix 1: staff_shifts status default was 'pending' which violates
-- the CHECK constraint. Correct default is 'scheduled'.
ALTER TABLE staff_shifts ALTER COLUMN status SET DEFAULT 'scheduled';

-- Fix 2: RPC referenced b.game_name which does not exist in bookings.
-- Correct column is b.game_id cast to text.
CREATE OR REPLACE FUNCTION public.insert_shift_with_retroactive_commission(p_schedule_id uuid, p_staff_id uuid, p_shift_date date, p_start_time time without time zone, p_end_time time without time zone, p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_shift_id UUID;
  v_commission_rate NUMERIC;
  rec RECORD;
BEGIN
  INSERT INTO staff_shifts (schedule_id, staff_id, shift_date, start_time, end_time, notes)
  VALUES (p_schedule_id, p_staff_id, p_shift_date, p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_shift_id;
  SELECT COALESCE(commission_rate, 0) INTO v_commission_rate
  FROM users WHERE id = p_staff_id;
  FOR rec IN
    SELECT b.id AS booking_id, b.booking_code, b.game_id::text AS game_name,
           COALESCE(b.final_amount_paid, 0) AS revenue, b.start_time AS b_time
    FROM bookings b
    WHERE b.booking_date = p_shift_date
      AND b.status = 'completed'
      AND b.start_time IS NOT NULL
      AND b.start_time::TIME >= p_start_time
      AND b.start_time::TIME < p_end_time
  LOOP
    INSERT INTO shift_game_log (shift_id, booking_id, booking_code, game_name, game_completed_at, game_revenue, commission_amount, commission_source)
    VALUES (v_shift_id, rec.booking_id, rec.booking_code, rec.game_name, NOW(), rec.revenue, rec.revenue * v_commission_rate / 100, 'retroactive')
    ON CONFLICT (booking_id, shift_id) DO NOTHING;
  END LOOP;
  RETURN (SELECT to_jsonb(s.*) FROM staff_shifts s WHERE s.id = v_shift_id);
END;
$$;
