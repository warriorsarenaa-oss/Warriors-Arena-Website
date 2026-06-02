-- SPRINT 4: Staff Shifts + Payroll System

-- 1. Update users table with payroll fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_per_game NUMERIC(10,2) DEFAULT 0;

-- 2. Weekly Schedule (the plan)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,  -- Always Sunday
  week_end DATE NOT NULL,    -- Always Saturday
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_published BOOLEAN DEFAULT false,
  notes TEXT
);

-- 3. Individual Shifts
CREATE TABLE IF NOT EXISTS staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES staff_schedules(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  actual_start TIME,          -- Actual clock-in time
  actual_end TIME,            -- Actual clock-out time
  hours_planned NUMERIC(5,2), -- Calculated from start/end
  hours_actual NUMERIC(5,2),  -- Calculated from actual_start/actual_end
  status TEXT DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Game-to-Shift Mapping (which games happened during this shift)
CREATE TABLE IF NOT EXISTS shift_game_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES staff_shifts(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  game_completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  commission_amount NUMERIC(10,2) NOT NULL
);

-- 5. Payroll Records
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Hours component
  total_hours NUMERIC(5,2) DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  hours_pay NUMERIC(10,2) DEFAULT 0,
  
  -- Commission component
  games_count INTEGER DEFAULT 0,
  commission_per_game NUMERIC(10,2) DEFAULT 0,
  commission_pay NUMERIC(10,2) DEFAULT 0,
  
  -- Total
  total_pay NUMERIC(10,2) DEFAULT 0,
  
  -- Payment
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES users(id),
  payment_method TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Update existing expenses table for payroll integration
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL;

-- 7. Ensure a 'Payroll' category exists
INSERT INTO expense_categories (name, is_system, display_order)
VALUES ('Payroll', true, 10)
ON CONFLICT (name) DO NOTHING;

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_game_log_shift_id ON shift_game_log(shift_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_week ON payroll_records(staff_id, week_start);
