-- Migration: Change Payroll Commission to Revenue Percentage
-- 1. Drop dependent views first with CASCADE
DROP VIEW IF EXISTS payroll_summary_by_week CASCADE;
DROP VIEW IF EXISTS staff_shifts_by_week CASCADE;
DROP VIEW IF EXISTS view_staff_payroll_breakdown CASCADE;

-- 2. Update users table to reflect it's a rate (%)
ALTER TABLE users RENAME COLUMN commission_per_game TO commission_rate;

-- 3. Update shift_game_log to store revenue
ALTER TABLE shift_game_log ADD COLUMN IF NOT EXISTS game_revenue NUMERIC(10,2) DEFAULT 0;

-- 4. Update payroll_records
-- We need to drop generated columns
ALTER TABLE payroll_records DROP COLUMN IF EXISTS total_pay CASCADE;
ALTER TABLE payroll_records DROP COLUMN IF EXISTS commission_pay CASCADE;

-- Add total_revenue column
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0;

-- Rename commission column for consistency
ALTER TABLE payroll_records RENAME COLUMN commission_per_game TO commission_rate;

-- Recreate generated columns with new logic: (total_revenue * commission_rate / 100)
ALTER TABLE payroll_records ADD COLUMN commission_pay NUMERIC(10,2) GENERATED ALWAYS AS 
  (total_revenue * commission_rate / 100.0) STORED;

ALTER TABLE payroll_records ADD COLUMN total_pay NUMERIC(10,2) GENERATED ALWAYS AS 
  (hours_pay + (total_revenue * commission_rate / 100.0)) STORED;

-- 4. Update Views
CREATE OR REPLACE VIEW staff_shifts_by_week AS
SELECT 
  ss.id,
  ss.staff_id,
  u.full_name as staff_name,
  ss.schedule_id,
  ss.shift_date,
  ss.start_time,
  ss.end_time,
  ss.hours_planned,
  u.hourly_rate,
  u.commission_rate,
  COUNT(sgl.id) as games_count,
  COALESCE(SUM(sgl.game_revenue), 0) as total_game_revenue
FROM staff_shifts ss
JOIN users u ON ss.staff_id = u.id
LEFT JOIN shift_game_log sgl ON ss.id = sgl.shift_id
GROUP BY ss.id, ss.staff_id, u.full_name, ss.schedule_id, ss.shift_date, 
         ss.start_time, ss.end_time, ss.hours_planned, u.hourly_rate, u.commission_rate;

CREATE OR REPLACE VIEW payroll_summary_by_week AS
SELECT 
  pr.id,
  pr.staff_id,
  u.full_name as staff_name,
  pr.week_start,
  pr.week_end,
  pr.total_hours,
  pr.hourly_rate,
  pr.hours_pay,
  pr.games_count,
  pr.total_revenue,
  pr.commission_rate,
  pr.commission_pay,
  pr.total_pay,
  pr.is_paid,
  pr.paid_at
FROM payroll_records pr
JOIN users u ON pr.staff_id = u.id
ORDER BY pr.week_start DESC, u.full_name ASC;
