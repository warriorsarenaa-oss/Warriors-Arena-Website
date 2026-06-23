-- Migration 032: Codify commission drift
-- Author: Warriors Arena
-- Date: 2026-06-23
--
-- Codifies objects that exist in the LIVE database but were never captured in a
-- migration (schema drift). All statements are idempotent / CREATE OR REPLACE,
-- so on the live DB this is a no-op, and on a fresh build it reproduces prod.
--
--   1.  shift_game_log.commission_source column (+ value CHECK constraint)
--   1b. UNIQUE (booking_id, shift_id) on shift_game_log -- required by the RPC's
--       ON CONFLICT clause; exists on live DB but missing from migrations.
--   2.  public.insert_shift_with_retroactive_commission(...) RPC
--       (body pulled verbatim from the live database via pg_get_functiondef)
--
-- Run manually in the Supabase SQL Editor. Does not modify application code.

-- Part 1: commission_source column
ALTER TABLE shift_game_log
  ADD COLUMN IF NOT EXISTS commission_source TEXT NOT NULL DEFAULT 'realtime';

ALTER TABLE shift_game_log
  DROP CONSTRAINT IF EXISTS shift_game_log_commission_source_check;

ALTER TABLE shift_game_log
  ADD CONSTRAINT shift_game_log_commission_source_check
  CHECK (commission_source = ANY (ARRAY['realtime','retroactive','manual']));

-- Part 1b: unique constraint on shift_game_log(booking_id, shift_id)
-- Required by the ON CONFLICT clause in the RPC below.
-- Exists on live DB but missing from migrations. Guarded so it is safe to run
-- whether or not the constraint already exists under this name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shift_game_log_booking_shift_unique'
  ) THEN
    ALTER TABLE shift_game_log
      ADD CONSTRAINT shift_game_log_booking_shift_unique
      UNIQUE (booking_id, shift_id);
  END IF;
END$$;

-- Part 2: RPC function (verbatim from live database)
CREATE OR REPLACE FUNCTION public.insert_shift_with_retroactive_commission(
  p_schedule_id uuid,
  p_staff_id uuid,
  p_shift_date date,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_shift_id        UUID;
  v_commission_rate NUMERIC;
  rec               RECORD;
BEGIN
  INSERT INTO staff_shifts (schedule_id, staff_id, shift_date, start_time, end_time, notes)
  VALUES (p_schedule_id, p_staff_id, p_shift_date, p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_shift_id;

  SELECT COALESCE(commission_rate, 0) INTO v_commission_rate
  FROM users WHERE id = p_staff_id;

  FOR rec IN
    SELECT b.id AS booking_id,
           b.booking_code,
           b.game_name,
           COALESCE(b.final_amount_paid, 0) AS revenue,
           b.start_time AS b_time
    FROM   bookings b
    WHERE  b.booking_date = p_shift_date
      AND  b.status       = 'completed'
      AND  b.start_time IS NOT NULL
      AND  b.start_time::TIME >= p_start_time
      AND  b.start_time::TIME <  p_end_time
  LOOP
    INSERT INTO shift_game_log (
      shift_id, booking_id, booking_code, game_name,
      game_completed_at, game_revenue, commission_amount, commission_source
    ) VALUES (
      v_shift_id,
      rec.booking_id,
      rec.booking_code,
      COALESCE(rec.game_name, 'Game'),
      NOW(),
      rec.revenue,
      rec.revenue * v_commission_rate / 100,
      'retroactive'
    )
    ON CONFLICT (booking_id, shift_id) DO NOTHING;
  END LOOP;

  RETURN (SELECT to_jsonb(s.*) FROM staff_shifts s WHERE s.id = v_shift_id);
END;
$function$;
