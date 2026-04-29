-- REFINED SALARY & COMMISSION LOGGING
-- This script ensures fixed salaries and commissions are stored in separate silos
-- and provides a summary view for the super admin.

-- 1. Ensure the logs table is robust
CREATE TABLE IF NOT EXISTS commission_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  percentage   NUMERIC(5,2) NOT NULL,
  period_month DATE NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '1 day'), -- For easy monthly filtering
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_logs_month ON commission_logs(period_month);
CREATE INDEX IF NOT EXISTS idx_commission_logs_user_month ON commission_logs(user_id, period_month);

-- 2. Create a View for the "Breakdown" as requested
-- This allows the admin to see Fixed Salary + Commissions side-by-side
CREATE OR REPLACE VIEW view_staff_payroll_breakdown AS
SELECT 
  u.id as user_id,
  u.username,
  u.fixed_monthly_salary as base_salary,
  COALESCE(SUM(cl.amount), 0) as total_commissions,
  u.fixed_monthly_salary + COALESCE(SUM(cl.amount), 0) as total_payout,
  COUNT(cl.id) as booking_count,
  TO_CHAR(COALESCE(cl.created_at, NOW()), 'YYYY-MM') as payroll_period
FROM users u
LEFT JOIN commission_logs cl ON u.id = cl.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.fixed_monthly_salary, TO_CHAR(COALESCE(cl.created_at, NOW()), 'YYYY-MM');

-- 3. Update the Trigger to be more "surgical"
-- It only inserts if the commission hasn't been logged for this booking yet
CREATE OR REPLACE FUNCTION fn_log_commission_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for manual bookings that have a commission and haven't been logged yet
  IF NEW.source = 'manual' 
     AND NEW.created_by_user_id IS NOT NULL 
     AND NEW.commission_amount > 0 
     AND NOT EXISTS (SELECT 1 FROM commission_logs WHERE booking_id = NEW.id) THEN
     
    INSERT INTO commission_logs (user_id, booking_id, amount, percentage, period_month)
    VALUES (
      NEW.created_by_user_id, 
      NEW.id, 
      NEW.commission_amount, 
      NEW.commission_percentage, 
      date_trunc('month', NEW.booking_date)::DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger
DROP TRIGGER IF EXISTS trg_log_commission ON bookings;
CREATE TRIGGER trg_log_commission
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_log_commission_on_booking();

COMMENT ON VIEW view_staff_payroll_breakdown IS 'Breakdown of fixed salaries vs commissions per month per staff member.';
