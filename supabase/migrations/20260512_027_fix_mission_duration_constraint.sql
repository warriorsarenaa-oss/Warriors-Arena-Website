-- Migration: Fix duration_minutes constraint to allow special mission bonuses
-- Author: Warriors Arena

-- 1. Remove the restrictive check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_duration_minutes_check;

-- 2. Add a more flexible constraint that allows for bonuses (e.g., up to 120 minutes)
ALTER TABLE bookings ADD CONSTRAINT bookings_duration_minutes_check 
  CHECK (duration_minutes >= 30 AND duration_minutes <= 120);

-- 3. Update the COMMENT to reflect the change
COMMENT ON COLUMN bookings.duration_minutes IS 'Total duration in minutes, including any special mission bonuses.';
