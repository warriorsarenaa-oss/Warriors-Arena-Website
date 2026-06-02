-- 1. Ensure all required permissions exist
INSERT INTO permissions (key, description) VALUES
  ('view_dashboard', 'Acess to the main dashboard overview'),
  ('view_revenue', 'Access to the revenue analytics page'),
  ('view_bookings', 'Access to the reservations list'),
  ('create_booking', 'Ability to create manual bookings'),
  ('cancel_booking', 'Ability to cancel bookings'),
  ('view_financials', 'Access to financials page'),
  ('manage_financials', 'Ability to add expenses and compute salaries'),
  ('manage_hours', 'Access to operating hours settings'),
  ('manage_pricing', 'Access to pricing settings'),
  ('manage_games', 'Access to games catalog management'),
  ('manage_bundles', 'Access to bundles management'),
  ('export_data', 'Access to the data export page'),
  ('manage_users', 'Access to user management and permissions'),
  ('view_audit', 'Access to the audit log')
ON CONFLICT (key) DO NOTHING;

-- 2. Create commission_logs table for real-time tracking
CREATE TABLE IF NOT EXISTS commission_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  percentage   NUMERIC(5,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_logs_user ON commission_logs(user_id);

-- 3. Create a trigger function to automatically log commission on manual bookings
CREATE OR REPLACE FUNCTION fn_log_commission_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_pct NUMERIC(5,2);
  v_commission_amt NUMERIC(10,2);
BEGIN
  -- Only log for manual bookings that have a commission
  IF NEW.source = 'manual' AND NEW.created_by_user_id IS NOT NULL AND NEW.commission_amount > 0 THEN
    INSERT INTO commission_logs (user_id, booking_id, amount, percentage)
    VALUES (NEW.created_by_user_id, NEW.id, NEW.commission_amount, NEW.commission_percentage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach the trigger
DROP TRIGGER IF EXISTS trg_log_commission ON bookings;
CREATE TRIGGER trg_log_commission
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_log_commission_on_booking();

COMMENT ON TABLE commission_logs IS 'Individual commission entries per manual booking for real-time payroll visibility.';
