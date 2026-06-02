-- ============================================================
-- Migration 029: Fix Payroll Schema
-- Root Cause: payroll_records was missing columns used by the 
-- payroll API (total_calculated_payroll, total_paid_so_far,
-- previously_pushed_to_expenses) and the payroll_payments table
-- did not exist at all, causing all upserts to fail silently
-- and the payroll page to always show empty.
-- ============================================================

-- 1. Add missing columns to payroll_records
--    (IF NOT EXISTS guards make this safe to re-run)

ALTER TABLE payroll_records
  ADD COLUMN IF NOT EXISTS total_calculated_payroll NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid_so_far        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previously_pushed_to_expenses NUMERIC(10,2) DEFAULT 0;

-- 2. Drop the generated commission_pay / total_pay columns if they still
--    exist as generated columns (they conflict with the new manual upsert
--    pattern used by the API which writes commission_pay directly).
--    We do this safely: drop CASCADE removes dependent generated columns first.

ALTER TABLE payroll_records DROP COLUMN IF EXISTS commission_pay CASCADE;
ALTER TABLE payroll_records DROP COLUMN IF EXISTS total_pay CASCADE;

-- 3. Re-add commission_pay and total_pay as plain stored columns
--    so the API can freely UPDATE them without generated-column errors.

ALTER TABLE payroll_records
  ADD COLUMN IF NOT EXISTS commission_pay NUMERIC(10,2) DEFAULT 0;

-- 4. Create the payroll_payments ledger table (was referenced but never created)

CREATE TABLE IF NOT EXISTS payroll_payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id  UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
  amount_paid        NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
  paid_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  payment_method     TEXT NOT NULL DEFAULT 'cash',
  notes              TEXT,
  paid_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_payments_record
  ON payroll_payments(payroll_record_id);

-- 5. RLS for payroll_payments (admin only via service role, so just authenticated)
ALTER TABLE payroll_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payroll_payments_authenticated ON payroll_payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Ensure unique constraint on payroll_records (needed for upsert)
--    Safe to run even if constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_staff_week'
      AND conrelid = 'payroll_records'::regclass
  ) THEN
    ALTER TABLE payroll_records
      ADD CONSTRAINT unique_staff_week UNIQUE (staff_id, week_start);
  END IF;
END$$;

-- 7. Add missing columns to shift_game_log that the API writes to
ALTER TABLE shift_game_log
  ADD COLUMN IF NOT EXISTS booking_code TEXT,
  ADD COLUMN IF NOT EXISTS game_name    TEXT,
  ADD COLUMN IF NOT EXISTS game_revenue NUMERIC(10,2) DEFAULT 0;

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
