-- Migration: Fix Payroll and Expenses logic
-- 1. Add unique constraint to payroll_records to allow upsert
ALTER TABLE payroll_records
ADD CONSTRAINT unique_staff_week UNIQUE (staff_id, week_start);

-- 2. Ensure expense_categories has 'Payroll'
INSERT INTO expense_categories (name, display_order, is_system)
VALUES ('Payroll', 99, true)
ON CONFLICT (name) DO NOTHING;
