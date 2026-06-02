-- ============================================
-- SPRINT 4 REFINE: STAFF SHIFTS + PAYROLL
-- ============================================

-- 1. Update users (staff) table
-- Drop dependent view first
DROP VIEW IF EXISTS view_staff_payroll_breakdown CASCADE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_per_game NUMERIC(10,2) DEFAULT 0;

-- Drop old monthly salary column (handle both possible names)
ALTER TABLE users DROP COLUMN IF EXISTS fixed_monthly_salary;
ALTER TABLE users DROP COLUMN IF EXISTS base_salary;

-- 2. Update staff_shifts (ensure generated hours_planned)
-- We need to drop the column and recreate it as generated
ALTER TABLE staff_shifts DROP COLUMN IF EXISTS hours_planned;
ALTER TABLE staff_shifts ADD COLUMN hours_planned NUMERIC(5,2) GENERATED ALWAYS AS 
  (EXTRACT(HOUR FROM (end_time - start_time)) + 
   EXTRACT(MINUTE FROM (end_time - start_time)) / 60.0) STORED;

-- 3. Update shift_game_log (add informative columns for easy reporting)
ALTER TABLE shift_game_log 
ADD COLUMN IF NOT EXISTS booking_code TEXT,
ADD COLUMN IF NOT EXISTS game_name TEXT;

-- 4. Update payroll_records (make calculations generated)
ALTER TABLE payroll_records DROP COLUMN IF EXISTS hours_pay;
ALTER TABLE payroll_records DROP COLUMN IF EXISTS commission_pay;
ALTER TABLE payroll_records DROP COLUMN IF EXISTS total_pay;

ALTER TABLE payroll_records ADD COLUMN hours_pay NUMERIC(10,2) GENERATED ALWAYS AS 
  (total_hours * hourly_rate) STORED;
ALTER TABLE payroll_records ADD COLUMN commission_pay NUMERIC(10,2) GENERATED ALWAYS AS 
  (games_count * commission_per_game) STORED;
ALTER TABLE payroll_records ADD COLUMN total_pay NUMERIC(10,2) GENERATED ALWAYS AS 
  ((total_hours * hourly_rate) + (games_count * commission_per_game)) STORED;

-- 5. Views for easy calculations
DROP VIEW IF EXISTS staff_shifts_by_week;
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
  COUNT(sgl.id) as games_count,
  COALESCE(SUM(sgl.commission_amount), 0) as total_commission
FROM staff_shifts ss
JOIN users u ON ss.staff_id = u.id
LEFT JOIN shift_game_log sgl ON ss.id = sgl.shift_id
GROUP BY ss.id, ss.staff_id, u.full_name, ss.schedule_id, ss.shift_date, 
         ss.start_time, ss.end_time, ss.hours_planned, u.hourly_rate;

DROP VIEW IF EXISTS payroll_summary_by_week;
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
  pr.commission_per_game,
  pr.commission_pay,
  pr.total_pay,
  pr.is_paid,
  pr.paid_at
FROM payroll_records pr
JOIN users u ON pr.staff_id = u.id
ORDER BY pr.week_start DESC, u.full_name ASC;
