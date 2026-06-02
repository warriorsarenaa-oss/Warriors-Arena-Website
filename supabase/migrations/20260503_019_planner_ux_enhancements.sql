-- ============================================
-- SPRINT 4 UX IMPROVEMENTS: SHIFT STATUS & COLORS
-- ============================================

-- Add status to staff_shifts
ALTER TABLE staff_shifts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- Add color to users (staff) for visual differentiation in the planner
ALTER TABLE users
ADD COLUMN IF NOT EXISTS staff_color TEXT DEFAULT '#22c55e';

-- Re-sync staff_shifts_by_week view to include status
DROP VIEW IF EXISTS staff_shifts_by_week;
CREATE OR REPLACE VIEW staff_shifts_by_week AS
SELECT 
  ss.id,
  ss.staff_id,
  u.full_name as staff_name,
  u.staff_color,
  ss.schedule_id,
  ss.shift_date,
  ss.start_time,
  ss.end_time,
  ss.hours_planned,
  ss.status,
  u.hourly_rate,
  COUNT(sgl.id) as games_count,
  COALESCE(SUM(sgl.commission_amount), 0) as total_commission
FROM staff_shifts ss
JOIN users u ON ss.staff_id = u.id
LEFT JOIN shift_game_log sgl ON ss.id = sgl.shift_id
GROUP BY ss.id, ss.staff_id, u.full_name, u.staff_color, ss.schedule_id, ss.shift_date, 
         ss.start_time, ss.end_time, ss.hours_planned, ss.status, u.hourly_rate;
